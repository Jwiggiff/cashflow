import {
  getStandardRecurrenceRRules,
  type StandardRecurrenceKind,
} from "@/lib/standard-recurrence-rrules";
import { getOccurenceInMonth } from "@/lib/utils";
import type { TransactionType } from "@prisma/client";
import { RRule } from "rrule";

/** How far back to load transactions/transfers for recurring-pattern recommendations. */
export const RECOMMENDATIONS_LOOKBACK_MONTHS = 24;

const MIN_OCCURRENCES = 3;

/** Days between local midnights */
function daysBetween(a: Date, b: Date): number {
  const u1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const u2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((u2 - u1) / 86400000);
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export function normalizeDescription(raw: string | null | undefined): string {
  return (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function classifyIntervalPattern(sortedDates: Date[]): StandardRecurrenceKind | null {
  if (sortedDates.length < MIN_OCCURRENCES) return null;

  const gaps: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    gaps.push(daysBetween(sortedDates[i - 1]!, sortedDates[i]!));
  }

  const med = median(gaps);

  const dom = sortedDates.map((d) => d.getDate());
  const sameDom = dom.every((d) => d === dom[0]);

  const weekdays = sortedDates.map((d) => d.getDay());
  const sameWeekday = weekdays.every((w) => w === weekdays[0]);

  const occ = sortedDates.map((d) => getOccurenceInMonth(d));
  const sameOcc = occ.every((o) => o === occ[0]);
  const sameNthWeekdayPattern =
    sameWeekday && sameOcc && occ.length === sortedDates.length;

  const monthlyGapOk = (g: number) => g >= 26 && g <= 35;
  const weeklyGapOk = (g: number) => g >= 5 && g <= 9;
  const biweeklyGapOk = (g: number) => g >= 12 && g <= 18;

  // Same calendar day each month (e.g. the 15th)
  if (sameDom && gaps.every(monthlyGapOk) && med >= 26 && med <= 35) {
    return "monthlyOnDay";
  }

  // Same weekday + ~7d between consecutive
  if (sameWeekday && gaps.every(weeklyGapOk) && med >= 5 && med <= 9) {
    return "weekly";
  }

  // Same weekday + ~14d
  if (sameWeekday && gaps.every(biweeklyGapOk) && med >= 12 && med <= 18) {
    return "biweekly";
  }

  // Nth weekday of month (per app helper), same weekday, ~monthly gaps
  if (
    sameNthWeekdayPattern &&
    gaps.every(monthlyGapOk) &&
    med >= 26 &&
    med <= 35
  ) {
    return "monthlyOnNthWeekday";
  }

  return null;
}

function recurringKeyTransaction(
  accountId: number,
  type: TransactionType,
  absAmount: number,
  normDesc: string
): string {
  return `tx:${accountId}:${type}:${roundMoney(absAmount)}:${normDesc}`;
}

function recurringKeyTransfer(
  fromId: number,
  toId: number,
  amount: number,
  normDesc: string
): string {
  return `tf:${fromId}:${toId}:${roundMoney(amount)}:${normDesc}`;
}

function hasExistingTransactionRecurring(
  keys: Set<string>,
  accountId: number,
  type: TransactionType,
  absAmount: number,
  normDesc: string
): boolean {
  return keys.has(recurringKeyTransaction(accountId, type, absAmount, normDesc));
}

function hasExistingTransferRecurring(
  keys: Set<string>,
  fromId: number,
  toId: number,
  amount: number,
  normDesc: string
): boolean {
  return keys.has(recurringKeyTransfer(fromId, toId, amount, normDesc));
}

export type DashboardRecurringPatternRecommendation =
  | {
      kind: "transaction";
      id: string;
      description: string;
      transactionType: TransactionType;
      /** Absolute amount for display and form */
      displayAmount: number;
      accountId: number;
      accountName: string;
      rrule: string;
      startDateIso: string;
      patternSummary: string;
      occurrenceCount: number;
    }
  | {
      kind: "transfer";
      id: string;
      description: string;
      amount: number;
      fromAccountId: number;
      toAccountId: number;
      fromAccountName: string;
      toAccountName: string;
      rrule: string;
      startDateIso: string;
      patternSummary: string;
      occurrenceCount: number;
    };

type TxRow = {
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  accountId: number;
  accountName: string;
};

type TfRow = {
  date: Date;
  description: string | null;
  amount: number;
  fromAccountId: number;
  toAccountId: number;
  fromAccountName: string;
  toAccountName: string;
};

export function detectRecurringPatternRecommendations(input: {
  transactions: TxRow[];
  transfers: TfRow[];
  existingRecurringTransactions: {
    accountId: number;
    type: TransactionType;
    amount: number;
    description: string;
  }[];
  existingRecurringTransfers: {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    description: string | null;
  }[];
}): DashboardRecurringPatternRecommendation[] {
  const since = new Date();
  since.setMonth(since.getMonth() - RECOMMENDATIONS_LOOKBACK_MONTHS);

  const existingTxKeys = new Set<string>();
  for (const r of input.existingRecurringTransactions) {
    const abs = Math.abs(r.amount);
    existingTxKeys.add(
      recurringKeyTransaction(
        r.accountId,
        r.type,
        abs,
        normalizeDescription(r.description)
      )
    );
  }

  const existingTfKeys = new Set<string>();
  for (const r of input.existingRecurringTransfers) {
    existingTfKeys.add(
      recurringKeyTransfer(
        r.fromAccountId,
        r.toAccountId,
        Math.abs(r.amount),
        normalizeDescription(r.description ?? "")
      )
    );
  }

  const txFiltered = input.transactions.filter((t) => t.date >= since);
  const tfFiltered = input.transfers.filter((t) => t.date >= since);

  const txGroups = new Map<string, TxRow[]>();
  for (const t of txFiltered) {
    const abs = Math.abs(t.amount);
    const nd = normalizeDescription(t.description);
    if (!nd) continue;
    const key = `${t.accountId}|${t.type}|${roundMoney(abs)}|${nd}`;
    const list = txGroups.get(key) ?? [];
    list.push(t);
    txGroups.set(key, list);
  }

  const tfGroups = new Map<string, TfRow[]>();
  for (const t of tfFiltered) {
    const nd = normalizeDescription(t.description ?? "");
    const key = `${t.fromAccountId}|${t.toAccountId}|${roundMoney(t.amount)}|${nd}`;
    const list = tfGroups.get(key) ?? [];
    list.push(t);
    tfGroups.set(key, list);
  }

  const out: DashboardRecurringPatternRecommendation[] = [];

  for (const [, rows] of txGroups) {
    if (rows.length < MIN_OCCURRENCES) continue;
    const sorted = [...rows].sort((a, b) => a.date.getTime() - b.date.getTime());
    const dates = sorted.map((r) => r.date);
    const patternKind = classifyIntervalPattern(dates);
    if (!patternKind) continue;

    const anchor = sorted[sorted.length - 1]!.date;
    const rrules = getStandardRecurrenceRRules(anchor);
    const rrule = rrules[patternKind];

    const sample = sorted[0]!;
    const absAmount = Math.abs(sample.amount);

    if (
      hasExistingTransactionRecurring(
        existingTxKeys,
        sample.accountId,
        sample.type,
        absAmount,
        normalizeDescription(sample.description)
      )
    ) {
      continue;
    }

    const patternSummary = capitalizeRRuleText(rrule);
    const id = `tx-${sample.accountId}-${sample.type}-${roundMoney(absAmount)}-${hashKey(normalizeDescription(sample.description))}-${patternKind}`;

    out.push({
      kind: "transaction",
      id,
      description: sample.description.trim(),
      transactionType: sample.type,
      displayAmount: absAmount,
      accountId: sample.accountId,
      accountName: sample.accountName,
      rrule,
      startDateIso: anchor.toISOString(),
      patternSummary,
      occurrenceCount: sorted.length,
    });
  }

  for (const [, rows] of tfGroups) {
    if (rows.length < MIN_OCCURRENCES) continue;
    const sorted = [...rows].sort((a, b) => a.date.getTime() - b.date.getTime());
    const dates = sorted.map((r) => r.date);
    const patternKind = classifyIntervalPattern(dates);
    if (!patternKind) continue;

    const anchor = sorted[sorted.length - 1]!.date;
    const rrules = getStandardRecurrenceRRules(anchor);
    const rrule = rrules[patternKind];

    const sample = sorted[0]!;
    if (
      hasExistingTransferRecurring(
        existingTfKeys,
        sample.fromAccountId,
        sample.toAccountId,
        sample.amount,
        normalizeDescription(sample.description ?? "")
      )
    ) {
      continue;
    }

    const patternSummary = capitalizeRRuleText(rrule);
    const id = `tf-${sample.fromAccountId}-${sample.toAccountId}-${roundMoney(sample.amount)}-${hashKey(normalizeDescription(sample.description ?? ""))}-${patternKind}`;

    out.push({
      kind: "transfer",
      id,
      description: (sample.description ?? "").trim(),
      amount: sample.amount,
      fromAccountId: sample.fromAccountId,
      toAccountId: sample.toAccountId,
      fromAccountName: sample.fromAccountName,
      toAccountName: sample.toAccountName,
      rrule,
      startDateIso: anchor.toISOString(),
      patternSummary,
      occurrenceCount: sorted.length,
    });
  }

  return dedupeById(out);
}

function hashKey(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function capitalizeRRuleText(rruleStr: string): string {
  const t = RRule.fromString(rruleStr).toText();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function dedupeById(
  items: DashboardRecurringPatternRecommendation[]
): DashboardRecurringPatternRecommendation[] {
  const seen = new Set<string>();
  return items.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

