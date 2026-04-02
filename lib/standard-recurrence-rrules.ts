import { getOccurenceInMonth, getOrdinal } from "@/lib/utils";
import { RRule } from "rrule";

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
    weekly: weekly.toString(),
    biweekly: biweekly.toString(),
    monthlyOnDay: monthlyOnDay.toString(),
    monthlyOnNthWeekday: monthlyOnNthWeekday.toString(),
  };
}

export type StandardRecurrenceKind =
  | "weekly"
  | "biweekly"
  | "monthlyOnDay"
  | "monthlyOnNthWeekday";
