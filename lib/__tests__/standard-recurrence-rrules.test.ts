import { describe, expect, it, vi } from "vitest";
import { RRule } from "rrule";
import {
  alignRRuleToStartDate,
  getStandardRecurrenceRRules,
  type StandardRecurrenceKind,
} from "@/lib/standard-recurrence-rrules";

const kinds: StandardRecurrenceKind[] = [
  "weekly",
  "biweekly",
  "monthlyOnDay",
  "monthlyOnNthWeekday",
];

describe("alignRRuleToStartDate", () => {
  // The recurrence Select only shows a selection when the stored rule exactly
  // matches one of the options generated for the current start date.
  it.each([
    ["to a later weekday in the same month", new Date(2026, 9, 6, 14, 30), new Date(2026, 9, 22, 9, 15)],
    ["to an earlier weekday", new Date(2026, 9, 22), new Date(2026, 9, 5)],
    ["into a different month", new Date(2026, 0, 31), new Date(2026, 1, 14)],
    ["to a Sunday", new Date(2026, 9, 6), new Date(2026, 9, 11)],
    ["to a 5th weekday of the month", new Date(2026, 9, 1), new Date(2026, 9, 29)],
  ])("matches the standard options after moving %s", (_, from, to) => {
    const before = getStandardRecurrenceRRules(from);
    const after = getStandardRecurrenceRRules(to);
    for (const kind of kinds) {
      expect(alignRRuleToStartDate(before[kind], to), kind).toBe(after[kind]);
    }
  });

  it("is a no-op for a rule already anchored to the start date", () => {
    const date = new Date(2026, 9, 6);
    const rules = getStandardRecurrenceRRules(date);
    for (const kind of kinds) {
      expect(alignRRuleToStartDate(rules[kind], date), kind).toBe(rules[kind]);
    }
  });

  it("keeps the interval when moving a biweekly rule", () => {
    const { biweekly } = getStandardRecurrenceRRules(new Date(2026, 9, 6));
    const aligned = alignRRuleToStartDate(biweekly, new Date(2026, 9, 15));
    expect(RRule.parseString(aligned).interval).toBe(2);
  });

  it("returns an empty rule unchanged", () => {
    expect(alignRRuleToStartDate("", new Date(2026, 9, 6))).toBe("");
  });

  it("returns an unparseable rule unchanged", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(alignRRuleToStartDate("not an rrule", new Date(2026, 9, 6))).toBe(
      "not an rrule"
    );
    spy.mockRestore();
  });
});
