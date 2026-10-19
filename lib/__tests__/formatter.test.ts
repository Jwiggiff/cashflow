import { describe, expect, it } from "vitest";
import { formatCompactCurrency } from "@/lib/formatter";

describe("formatCompactCurrency", () => {
  it("shortens thousands", () => {
    expect(formatCompactCurrency(10000)).toBe("$10k");
    expect(formatCompactCurrency(7500)).toBe("$7.5k");
    expect(formatCompactCurrency(1250000)).toBe("$1.3M");
  });

  it("drops cents below a thousand", () => {
    expect(formatCompactCurrency(0)).toBe("$0");
    expect(formatCompactCurrency(999)).toBe("$999");
  });

  it("keeps the sign for negatives", () => {
    expect(formatCompactCurrency(-2500)).toBe("-$2.5k");
  });
});
