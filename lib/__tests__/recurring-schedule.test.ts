import { describe, expect, it } from "vitest";
import { RRule } from "rrule";
import { computeNextDueDateForCreate } from "@/lib/recurring-schedule";

describe("computeNextDueDateForCreate", () => {
  it("jumps a past start date forward to the next occurrence on/after today", () => {
    const now = new Date(2026, 5, 15); // June 15, 2026 (Monday)
    const rrule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: RRule.MO,
      dtstart: new Date(2026, 0, 5), // an old anchor, months back
    });

    const result = computeNextDueDateForCreate(rrule, new Date(2026, 0, 5), now);

    expect(result >= now).toBe(true);
    expect(result.getDay()).toBe(1); // still a Monday
  });

  it("honors a future start date exactly, even if an earlier occurrence exists", () => {
    const now = new Date(2026, 5, 15); // June 15, 2026 (Monday)
    const futureStart = new Date(2026, 8, 1); // Sept 1, 2026 (Tuesday) - deliberately future
    const rrule = new RRule({
      freq: RRule.MONTHLY,
      bymonthday: 1,
      dtstart: futureStart,
    });

    const result = computeNextDueDateForCreate(rrule, futureStart, now);

    expect(result).toEqual(futureStart);
  });

  it("honors today's date as-is rather than treating it as past", () => {
    const now = new Date(2026, 5, 15, 14, 30); // June 15, 2026, 2:30pm
    const today = new Date(2026, 5, 15); // same day, midnight
    const rrule = new RRule({ freq: RRule.WEEKLY, byweekday: RRule.MO, dtstart: today });

    const result = computeNextDueDateForCreate(rrule, today, now);

    expect(result).toEqual(today);
  });
});
