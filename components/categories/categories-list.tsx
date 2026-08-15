"use client";

import { useFormatters } from "@/hooks/use-formatters";
import { Category } from "@prisma/client";
import { TagIcon } from "lucide-react";
import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic";
import { CategoryActionsCell } from "./category-actions-cell";
import { EmptyState } from "./empty-state";

interface CategoriesListProps {
  categories: Category[];
  currentMonthData: {
    categoryId: number | null;
    amount: number;
    transactionCount: number;
  }[];
}

export function CategoriesList({
  categories,
  currentMonthData,
}: CategoriesListProps) {
  const { formatCurrency } = useFormatters();

  if (categories.length === 0) {
    return <EmptyState />;
  }

  const categoriesWithData = categories.map((category) => {
    const data = currentMonthData.find(
      (entry) => entry.categoryId === category.id
    );

    return {
      ...category,
      currentMonthSpent: data?.amount ?? 0,
      transactionCount: data?.transactionCount ?? 0,
    };
  });

  return (
    <ul className="w-full space-y-3">
      {categoriesWithData.map((category) => {
        const transactionLabel =
          category.transactionCount === 1
            ? "1 transaction"
            : `${category.transactionCount} transactions`;

        return (
          <li
            key={category.id}
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  {category.icon ? (
                    <DynamicIcon
                      name={
                        category.icon as keyof typeof dynamicIconImports
                      }
                      className="size-4"
                      aria-hidden
                    />
                  ) : (
                    <TagIcon className="size-4" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium @3xl:text-base">
                    {category.name}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {transactionLabel}
                  </div>
                </div>
                <div className="shrink-0 text-right @3xl:hidden">
                  <div className="text-sm font-semibold tabular-nums">
                    {formatCurrency(Math.abs(category.currentMonthSpent))}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    This month
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t pt-3 @3xl:border-t-0 @3xl:pt-0">
                <div className="hidden text-right @3xl:block">
                  <div className="font-semibold tabular-nums">
                    {formatCurrency(Math.abs(category.currentMonthSpent))}
                  </div>
                  <div className="text-sm text-muted-foreground">This month</div>
                </div>

                <div className="flex flex-1 items-center justify-between gap-2 @3xl:flex-initial @3xl:justify-end">
                  <span className="text-sm text-muted-foreground @3xl:hidden">
                    Actions
                  </span>
                  <CategoryActionsCell category={category} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
