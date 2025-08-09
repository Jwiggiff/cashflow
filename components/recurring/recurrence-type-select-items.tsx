import { SelectItem } from "@/components/ui/select";
import {
  capitalizeFirstLetter,
  getOccurenceInMonth,
  getOrdinal,
} from "@/lib/utils";
import { RRule } from "rrule";

export function RecurrenceTypeSelectItems({ startDate }: { startDate: Date }) {
  const weekly_rrule = RRule.fromText(
    `Every week on ${startDate.toLocaleDateString("en-US", {
      weekday: "long",
    })}`
  );
  const biweekly_rrule = RRule.fromText(
    `Every 2 weeks on ${startDate.toLocaleDateString("en-US", {
      weekday: "long",
    })}`
  );
  const monthly_day_rrule = RRule.fromText(
    `Every month on the ${getOrdinal(startDate.getDate())}`
  );
  const monthly_nth_day_rrule = RRule.fromText(
    `Every month on the ${getOrdinal(
      getOccurenceInMonth(startDate)
    )} ${startDate.toLocaleDateString("en-US", { weekday: "long" })}`
  );

  return (
    <>
      <SelectItem value={weekly_rrule.toString()}>
        {capitalizeFirstLetter(weekly_rrule.toText())}
      </SelectItem>
      <SelectItem value={biweekly_rrule.toString()}>
        {capitalizeFirstLetter(biweekly_rrule.toText())}
      </SelectItem>
      <SelectItem value={monthly_day_rrule.toString()}>
        {capitalizeFirstLetter(monthly_day_rrule.toText())}
      </SelectItem>
      <SelectItem value={monthly_nth_day_rrule.toString()}>
        {capitalizeFirstLetter(monthly_nth_day_rrule.toText())}
      </SelectItem>
    </>
  );
}
