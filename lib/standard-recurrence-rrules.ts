import { getOccurenceInMonth, getOrdinal } from "@/lib/utils";
import { RRule } from "rrule";

/**
 * `RRule.fromText` never sets `dtstart` on the returned rule's `origOptions`,
 * so `.toString()` omits it - every later `RRule.fromString`/`new RRule(...)`
 * (dialog re-opens, form edits, each cron tick) re-defaults dtstart to
 * whichever moment that code happens to run. That's harmless for
 * weekly/monthly patterns since BYDAY/BYMONTHDAY/BYSETPOS fully constrain
 * the valid days, but for `INTERVAL=2` (biweekly) the on/off week parity is
 * derived from dtstart, so it could drift a week off from the actual
 * historical cadence. Rebuilding with an explicit dtstart makes the
 * serialized string carry it, so every later parse is anchored consistently.
 */
function withDtstart(rule: RRule, dtstart: Date): RRule {
  return new RRule({ ...rule.origOptions, dtstart });
}

/**
 * RRULE strings for the four options in RecurrenceTypeSelectItems, anchored to startDate.
 * Keep in sync with components/recurring/recurrence-type-select-items.tsx.
 */
export function getStandardRecurrenceRRules(startDate: Date) {
  const weekly = RRule.fromText(
    `Every week on ${startDate.toLocaleDateString("en-US", {
      weekday: "long",
    })}`
  );
  const biweekly = RRule.fromText(
    `Every 2 weeks on ${startDate.toLocaleDateString("en-US", {
      weekday: "long",
    })}`
  );
  const monthlyOnDay = RRule.fromText(
    `Every month on the ${getOrdinal(startDate.getDate())}`
  );
  const monthlyOnNthWeekday = RRule.fromText(
    `Every month on the ${getOrdinal(
      getOccurenceInMonth(startDate)
    )} ${startDate.toLocaleDateString("en-US", { weekday: "long" })}`
  );

  return {
    weekly: withDtstart(weekly, startDate).toString(),
    biweekly: withDtstart(biweekly, startDate).toString(),
    monthlyOnDay: withDtstart(monthlyOnDay, startDate).toString(),
    monthlyOnNthWeekday: withDtstart(monthlyOnNthWeekday, startDate).toString(),
  };
}

export type StandardRecurrenceKind =
  | "weekly"
  | "biweekly"
  | "monthlyOnDay"
  | "monthlyOnNthWeekday";
