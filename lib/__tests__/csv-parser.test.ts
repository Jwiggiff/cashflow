import { describe, expect, it } from "vitest";
import { parseCSV } from "@/lib/csv-parser";

describe("parseCSV", () => {
  it("parses rows with currency symbols and empty amounts", () => {
    const csv = [
      "2025-01-02,Coffee Shop,$4.50,,$1000.00",
      "2025-01-03,Paycheck,,£2500,€3495.50",
    ].join("\n");

    expect(parseCSV(csv)).toEqual([
      { date: "2025-01-02", merchant: "Coffee Shop", expense: 4.5, income: 0, balance: 1000 },
      { date: "2025-01-03", merchant: "Paycheck", expense: 0, income: 2500, balance: 3495.5 },
    ]);
  });

  it("handles quoted fields containing commas", () => {
    const csv = '2025-01-02,"Store, Inc.","1,234.56",,"9,000.00"';

    expect(parseCSV(csv)).toEqual([
      { date: "2025-01-02", merchant: "Store, Inc.", expense: 1234.56, income: 0, balance: 9000 },
    ]);
  });

  it("unescapes doubled quotes inside quoted fields", () => {
    const csv = '2025-01-02,"Joe""s Diner",12.00,,100.00\n2025-01-03,"The ""Best"" Shop",1,,99';

    expect(parseCSV(csv).map((t) => t.merchant)).toEqual([
      'Joe"s Diner',
      'The "Best" Shop',
    ]);
  });

  it("skips blank lines and rows with too few columns", () => {
    const csv = "2025-01-02,A,1,0,10\n\n2025-01-03,B,2\n";

    expect(parseCSV(csv)).toHaveLength(1);
  });
});
