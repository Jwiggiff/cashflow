import type { ExpenseData } from "@/lib/types";

export const OTHER_EXPENSES_KEY = "__other";

// There are only five chart colours, so the rest share an "Other" slice
export function groupTopExpenses(
  expenses: ExpenseData[],
  limit = 5
): ExpenseData[] {
  const sorted = [...expenses].sort((a, b) => b.value - a.value);
  if (sorted.length <= limit) {
    return sorted;
  }

  const other = sorted
    .slice(limit)
    .reduce((sum, expense) => sum + expense.value, 0);
  return [
    ...sorted.slice(0, limit),
    { category: OTHER_EXPENSES_KEY, value: other },
  ];
}
