import { getOccurenceInMonth, getOrdinal } from "@/lib/utils";
import { RRule, Weekday } from "rrule";

/**
 * `RRule.fromText` leaves dtstart out of `origOptions`, so `.toString()` omits
 * it and every later parse defaults dtstart to "now". Weekly and monthly rules
 * are fully pinned by BYDAY/BYMONTHDAY/BYSETPOS, but biweekly week parity comes
 * from dtstart and would drift. Rebuilding with an explicit dtstart keeps it in
 * the serialized string.
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

/**
 * Re-anchor an rrule to a new start date, keeping its pattern (weekday, day of
 * month or nth weekday) and moving dtstart. For the standard options this
 * returns exactly what getStandardRecurrenceRRules(startDate) does, so the
 * recurrence Select keeps a matching value. Empty or unparseable rules are
 * returned unchanged.
 */
export function alignRRuleToStartDate(rrule: string, startDate: Date): string {
  if (!rrule) return rrule;
  try {
    const options = RRule.parseString(rrule);
    const weekday = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;

    if (options.freq === RRule.WEEKLY) {
      options.byweekday = weekday;
    } else if (options.freq === RRule.MONTHLY) {
      if (options.byweekday) {
        options.byweekday = new Weekday(weekday).nth(
          getOccurenceInMonth(startDate)
        );
      } else {
        options.bymonthday = startDate.getDate();
      }
    }

    options.dtstart = startDate;
    return RRule.optionsToString(options);
  } catch (error) {
    console.error("Error updating recurrence type:", error);
    return rrule;
  }
}

export type StandardRecurrenceKind =
  | "weekly"
  | "biweekly"
  | "monthlyOnDay"
  | "monthlyOnNthWeekday";
