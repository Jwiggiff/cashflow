import { describe, expect, it } from "vitest";
import {
  capitalize,
  getOccurenceInMonth,
  getOrdinal,
  slugify,
} from "@/lib/utils";

describe("utils", () => {
  it("slugify", () => {
    expect(slugify("Food & Dining")).toBe("food__dining");
  });

  it("capitalize", () => {
    expect(capitalize("hello WORLD")).toBe("Hello World");
  });

  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [31, "31st"],
  ])("getOrdinal(%i) = %s", (n, expected) => {
    expect(getOrdinal(n)).toBe(expected);
  });

  it.each([
    [1, 1],
    [7, 1],
    [8, 2],
    [14, 2],
    [15, 3],
    [29, 5],
  ])("getOccurenceInMonth(day %i) = %i", (day, expected) => {
    expect(getOccurenceInMonth(new Date(2025, 0, day))).toBe(expected);
  });
});
