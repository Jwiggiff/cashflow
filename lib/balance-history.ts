import type { BalanceHistoryPoint } from "@/lib/types";

export const BALANCE_HISTORY_MONTHS = 12;

export type BalanceSnapshotRecord = {
  accountId: number;
  balance: number;
  recordedAt: Date;
};

export function getBalanceHistoryStart(now = new Date()) {
  return new Date(
    now.getFullYear(),
    now.getMonth() - BALANCE_HISTORY_MONTHS,
    now.getDate()
  );
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sortSnapshots(snapshots: BalanceSnapshotRecord[]) {
  return [...snapshots].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
  );
}

export function buildAccountBalanceHistory(
  snapshots: BalanceSnapshotRecord[],
  startDate: Date
): BalanceHistoryPoint[] {
  const dailyBalances = new Map<string, number>();
  let openingBalance: number | undefined;

  for (const snapshot of sortSnapshots(snapshots)) {
    if (snapshot.recordedAt < startDate) {
      openingBalance = snapshot.balance;
      continue;
    }

    dailyBalances.set(toDateKey(snapshot.recordedAt), snapshot.balance);
  }

  if (openingBalance !== undefined) {
    const startDateKey = toDateKey(startDate);
    if (!dailyBalances.has(startDateKey)) {
      dailyBalances.set(startDateKey, openingBalance);
    }
  }

  return Array.from(dailyBalances, ([date, balance]) => ({ date, balance })).sort(
    (a, b) => a.date.localeCompare(b.date)
  );
}

export function buildNetWorthHistory(
  snapshots: BalanceSnapshotRecord[],
  startDate: Date
): BalanceHistoryPoint[] {
  const balancesByAccount = new Map<number, number>();
  const recentSnapshotsByDate = new Map<string, BalanceSnapshotRecord[]>();

  for (const snapshot of sortSnapshots(snapshots)) {
    if (snapshot.recordedAt < startDate) {
      balancesByAccount.set(snapshot.accountId, snapshot.balance);
      continue;
    }

    const date = toDateKey(snapshot.recordedAt);
    const dailySnapshots = recentSnapshotsByDate.get(date) ?? [];
    dailySnapshots.push(snapshot);
    recentSnapshotsByDate.set(date, dailySnapshots);
  }

  const history: BalanceHistoryPoint[] = [];

  if (balancesByAccount.size > 0) {
    history.push({
      date: toDateKey(startDate),
      balance: sumBalances(balancesByAccount),
    });
  }

  for (const [date, dailySnapshots] of recentSnapshotsByDate) {
    for (const snapshot of dailySnapshots) {
      balancesByAccount.set(snapshot.accountId, snapshot.balance);
    }

    const point = {
      date,
      balance: sumBalances(balancesByAccount),
    };

    if (history.at(-1)?.date === date) {
      history[history.length - 1] = point;
    } else {
      history.push(point);
    }
  }

  return history;
}

function sumBalances(balances: Map<number, number>) {
  return Array.from(balances.values()).reduce(
    (total, balance) => total + balance,
    0
  );
}
