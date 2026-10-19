import { describe, expect, it } from "vitest";
import { chartColor } from "@/lib/chart-colors";

describe("chartColor", () => {
  it("uses the theme colours first", () => {
    expect([0, 1, 2, 3, 4].map(chartColor)).toEqual([
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ]);
  });

  it("gives every later slice its own colour", () => {
    const extra = Array.from({ length: 30 }, (_, i) => chartColor(i + 5));
    expect(new Set(extra).size).toBe(30);
    expect(extra[0]).toBe(
      "oklch(var(--chart-extra-l) var(--chart-extra-c) 20.0)"
    );
  });
});
