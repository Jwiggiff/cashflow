import { describe, expect, it } from "vitest";
import {
  buildAccountBalanceHistory,
  buildNetWorthHistory,
  getBalanceHistoryStart,
  type BalanceSnapshotRecord,
} from "@/lib/balance-history";

let nextId = 1;
function snap(accountId: number, balance: number, date: string): BalanceSnapshotRecord {
  return { id: nextId++, accountId, balance, recordedAt: new Date(`${date}T12:00:00`) };
}

describe("getBalanceHistoryStart", () => {
  it("goes back 12 months", () => {
    expect(getBalanceHistoryStart(new Date(2025, 5, 15))).toEqual(new Date(2024, 5, 15));
  });

  it("clamps to the last day of the target month", () => {
    expect(getBalanceHistoryStart(new Date(2024, 1, 29))).toEqual(new Date(2023, 1, 28));
  });
});

describe("buildAccountBalanceHistory", () => {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 0, 31);

  it("carries the opening balance and extends to the end date", () => {
    const history = buildAccountBalanceHistory(
      [snap(1, 100, "2024-12-15"), snap(1, 150, "2025-01-10")],
      start,
      end
    );

    expect(history).toEqual([
      { date: "2025-01-01", balance: 100 },
      { date: "2025-01-10", balance: 150 },
      { date: "2025-01-31", balance: 150 },
    ]);
  });

  it("keeps the last snapshot of the day", () => {
    const history = buildAccountBalanceHistory(
      [snap(1, 100, "2025-01-10"), snap(1, 200, "2025-01-10")],
      start,
      end
    );

    expect(history).toEqual([
      { date: "2025-01-10", balance: 200 },
      { date: "2025-01-31", balance: 200 },
    ]);
  });

  it("returns nothing without snapshots", () => {
    expect(buildAccountBalanceHistory([], start, end)).toEqual([]);
  });
});

describe("buildNetWorthHistory", () => {
  it("sums the latest balance of each account", () => {
    const history = buildNetWorthHistory(
      [
        snap(1, 100, "2024-12-01"),
        snap(2, 50, "2024-12-01"),
        snap(1, 120, "2025-01-05"),
        snap(2, 80, "2025-01-20"),
      ],
      new Date(2025, 0, 1),
      new Date(2025, 0, 31)
    );

    expect(history).toEqual([
      { date: "2025-01-01", balance: 150 },
      { date: "2025-01-05", balance: 170 },
      { date: "2025-01-20", balance: 200 },
      { date: "2025-01-31", balance: 200 },
    ]);
  });
});
