import { describe, expect, it } from "vitest";
import {
  groupTopExpenses,
  OTHER_EXPENSES_KEY,
} from "@/lib/expense-breakdown";

describe("groupTopExpenses", () => {
  it("sorts by amount and keeps everything when within the limit", () => {
    expect(
      groupTopExpenses([
        { category: "dining", value: 50 },
        { category: "rent", value: 1600 },
        { category: "groceries", value: 400 },
      ])
    ).toEqual([
      { category: "rent", value: 1600 },
      { category: "groceries", value: 400 },
      { category: "dining", value: 50 },
    ]);
  });

  it("combines everything past the limit into Other", () => {
    const expenses = [10, 60, 20, 50, 30, 40, 5].map((value, i) => ({
      category: `c${i}`,
      value,
    }));

    expect(groupTopExpenses(expenses)).toEqual([
      { category: "c1", value: 60 },
      { category: "c3", value: 50 },
      { category: "c5", value: 40 },
      { category: "c4", value: 30 },
      { category: "c2", value: 20 },
      { category: OTHER_EXPENSES_KEY, value: 15 },
    ]);
  });

  it("returns an empty list for no expenses", () => {
    expect(groupTopExpenses([])).toEqual([]);
  });
});
