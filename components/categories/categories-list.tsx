"use client";

import { Category } from "@prisma/client";
import { CategoryActionsCell } from "./category-actions-cell";
import { EmptyState } from "./empty-state";
import { formatCurrency } from "@/lib/utils";
import { iconOptions } from "@/lib/icon-options";

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
  if (categories.length === 0) {
    return <EmptyState />;
  }

  const categoriesWithData = categories.map((category) => {
    const data = currentMonthData.find(
      (data) => data.categoryId === category.id
    );

    return {
      ...category,
      currentMonthSpent: data?.amount ?? 0,
      transactionCount: data?.transactionCount ?? 0,
    };
  });

  return (
    <div className="w-full space-y-2">
      {categoriesWithData.map((category) => {
        const Icon = iconOptions.find(
          (icon) => icon.value === category.icon
        )?.icon;

        return (
          <div
            key={category.name}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <div className="font-medium text-lg flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {category.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {category.transactionCount} transactions
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(category.currentMonthSpent)}
                </div>
                <div className="text-sm text-muted-foreground">This month</div>
              </div>
              <CategoryActionsCell category={category} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
