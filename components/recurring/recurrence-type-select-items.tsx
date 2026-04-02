import { SelectItem } from "@/components/ui/select";
import { capitalizeFirstLetter } from "@/lib/utils";
import { getStandardRecurrenceRRules } from "@/lib/standard-recurrence-rrules";
import { RRule } from "rrule";

export function RecurrenceTypeSelectItems({ startDate }: { startDate: Date }) {
  const {
    weekly: weekly_rrule,
    biweekly: biweekly_rrule,
    monthlyOnDay: monthly_day_rrule,
    monthlyOnNthWeekday: monthly_nth_day_rrule,
  } = getStandardRecurrenceRRules(startDate);

  return (
    <>
      <SelectItem value={weekly_rrule}>
        {capitalizeFirstLetter(RRule.fromString(weekly_rrule).toText())}
      </SelectItem>
      <SelectItem value={biweekly_rrule}>
        {capitalizeFirstLetter(RRule.fromString(biweekly_rrule).toText())}
      </SelectItem>
      <SelectItem value={monthly_day_rrule}>
        {capitalizeFirstLetter(RRule.fromString(monthly_day_rrule).toText())}
      </SelectItem>
      <SelectItem value={monthly_nth_day_rrule}>
        {capitalizeFirstLetter(RRule.fromString(monthly_nth_day_rrule).toText())}
      </SelectItem>
    </>
  );
}
