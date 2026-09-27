import { describe, expect, it } from "vitest";
import { detectRecurringPatternRecommendations } from "@/lib/recommendations/detect-recurring-patterns";

function monthsAgo(n: number, day: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - n, day);
}

const netflix = [3, 2, 1].map((n) => ({
  date: monthsAgo(n, 15),
  description: "Netflix",
  amount: -15.99,
  type: "EXPENSE" as const,
  accountId: 1,
  accountName: "Checking",
}));

describe("detectRecurringPatternRecommendations", () => {
  it("recommends a monthly transaction on the same day", () => {
    const recs = detectRecurringPatternRecommendations({
      transactions: netflix,
      transfers: [],
      existingRecurringTransactions: [],
      existingRecurringTransfers: [],
    });

    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({
      kind: "transaction",
      description: "Netflix",
      displayAmount: 15.99,
      occurrenceCount: 3,
    });
    expect(recs[0]!.rrule).toContain("FREQ=MONTHLY");
  });

  it("skips patterns that already have a recurring transaction", () => {
    const recs = detectRecurringPatternRecommendations({
      transactions: netflix,
      transfers: [],
      existingRecurringTransactions: [
        { accountId: 1, type: "EXPENSE", amount: 15.99, description: " netflix " },
      ],
      existingRecurringTransfers: [],
    });

    expect(recs).toEqual([]);
  });

  it("ignores patterns with fewer than three occurrences", () => {
    const recs = detectRecurringPatternRecommendations({
      transactions: netflix.slice(0, 2),
      transfers: [],
      existingRecurringTransactions: [],
      existingRecurringTransfers: [],
    });

    expect(recs).toEqual([]);
  });
});
