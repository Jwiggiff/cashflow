"use client";

import { BalanceHistoryChart } from "@/components/balance-history-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useFormatters } from "@/hooks/use-formatters";
import type { DashboardRecurringPatternRecommendation } from "@/lib/recommendations/detect-recurring-patterns";
import type {
  BalanceHistoryPoint,
  DashboardStats,
  ExpenseData,
  MonthlyData,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import type { BankAccount, Category } from "@prisma/client";
import { useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { CurrencyTooltipFormatter } from "./currency-tooltip-formatter";
import { DashboardRecommendations } from "./dashboard-recommendations";

type CompactDashboardProps = {
  stats: DashboardStats;
  monthlyData: MonthlyData[];
  expenseData: ExpenseData[];
  netWorthHistory: BalanceHistoryPoint[];
  recommendations: DashboardRecurringPatternRecommendation[];
  accounts: BankAccount[];
  categories: Category[];
};

function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(amount) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(amount) >= 1000 ? 1 : 0,
  })
    .format(amount)
    .replace("K", "k");
}

function getNetWorthChange(history: BalanceHistoryPoint[]) {
  const latest = history.at(-1);
  if (!latest) {
    return { value: 0, label: "No history yet" };
  }

  const [year, month] = latest.date.split("-").map(Number);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthOpening = history
    .filter((point) => point.date < monthStart)
    .at(-1);
  const opening = monthOpening ?? history.find((point) => point.date >= monthStart);

  return {
    value: latest.balance - (opening?.balance ?? latest.balance),
    label: monthOpening ? "this month" : "since tracking began",
  };
}

function MobileCashFlowChart({
  data,
}: {
  data: MonthlyData[];
}) {
  const { formatCurrency, isPrivate } = useFormatters();
  const [months, setMonths] = useState(6);
  const visibleData = useMemo(() => data.slice(-months), [data, months]);
  const chartId = useId().replace(/:/g, "");

  return (
    <Card className="-mx-4 gap-4 rounded-none border-x-0 py-4 shadow-none">
      <CardHeader className="gap-3 px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Cash Flow</CardTitle>
          <div
            className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
            role="group"
            aria-label="Cash flow range"
          >
            {[3, 6, 12].map((range) => (
              <Button
                key={range}
                type="button"
                size="sm"
                variant={months === range ? "default" : "ghost"}
                className="h-7 px-2"
                onClick={() => setMonths(range)}
                aria-pressed={months === range}
              >
                {range === 12 ? "1Y" : `${range}M`}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--chart-2)]" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" />
            Expenses
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <ChartContainer
          className="h-[220px] w-full"
          config={{
            income: { label: "Income", color: "var(--chart-2)" },
            expenses: { label: "Expenses", color: "var(--destructive)" },
          }}
        >
          <AreaChart
            data={visibleData}
            margin={{ top: 8, right: 24, bottom: 0, left: 8 }}
          >
            <defs>
              <linearGradient
                id={`mobile-income-${chartId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient
                id={`mobile-expenses-${chartId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={58}
              tickFormatter={(value) =>
                isPrivate
                  ? formatCurrency(value)
                  : formatCompactCurrency(value)
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(_, __, item) => (
                    <CurrencyTooltipFormatter item={item} />
                  )}
                />
              }
            />
            <Area
              dataKey="income"
              type="monotone"
              fill={`url(#mobile-income-${chartId})`}
              stroke="var(--color-income)"
              strokeWidth={2}
            />
            <Area
              dataKey="expenses"
              type="monotone"
              fill={`url(#mobile-expenses-${chartId})`}
              stroke="var(--color-expenses)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function MobileSpendingBreakdown({ data }: { data: ExpenseData[] }) {
  const { formatCurrency } = useFormatters();
  const expenses = [...data].sort((a, b) => b.value - a.value).slice(0, 5);
  const largestExpense = expenses[0]?.value ?? 0;

  return (
    <Card className="-mx-4 gap-4 rounded-none border-x-0 py-4 shadow-none">
      <CardHeader className="px-4">
        <CardTitle>Top Spending</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        {expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No expenses recorded this month.
          </p>
        ) : (
          expenses.map((expense) => (
            <div key={expense.category} className="space-y-1.5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate font-medium">{expense.category}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatCurrency(expense.value)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${
                      largestExpense > 0
                        ? (expense.value / largestExpense) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/** Full-bleed dashboard stack shown below the `@3xl` content breakpoint. */
export function CompactDashboard({
  stats,
  monthlyData,
  expenseData,
  netWorthHistory,
  recommendations,
  accounts,
  categories,
}: CompactDashboardProps) {
  const { formatCurrency, formatPercentage, isPrivate } = useFormatters();
  const netWorthChange = getNetWorthChange(netWorthHistory);

  return (
    <div className="flex-1 space-y-4 @3xl:hidden">
      <Card className="-mx-4 gap-4 rounded-none border-x-0 py-4 shadow-none">
        <CardHeader className="px-4">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Net Worth
              </div>
              <div className="truncate text-3xl font-bold tabular-nums">
                {formatCurrency(stats.totalBalance.value)}
              </div>
            </div>
            <div className="min-w-0 text-right">
              <div
                className={cn(
                  "truncate text-sm font-semibold tabular-nums",
                  !isPrivate &&
                    netWorthChange.value > 0 &&
                    "text-emerald-700 dark:text-emerald-400",
                  !isPrivate &&
                    netWorthChange.value < 0 &&
                    "text-destructive"
                )}
              >
                {!isPrivate && netWorthChange.value > 0 ? "+" : ""}
                {formatCurrency(netWorthChange.value)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {netWorthChange.label}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <BalanceHistoryChart
            data={netWorthHistory}
            className="h-[230px] w-full"
          />
        </CardContent>
      </Card>

      <Card className="-mx-4 gap-0 rounded-none border-x-0 py-0 shadow-none">
        <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">
          This month
        </div>
        <div className="grid grid-cols-2">
          <div className="min-w-0 p-4">
            <div className="text-xs text-muted-foreground">Income</div>
            <div className="truncate text-sm font-semibold tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatCurrency(stats.monthlyIncome.value)}
            </div>
          </div>
          <div className="min-w-0 border-l p-4 text-right">
            <div className="text-xs text-muted-foreground">Expenses</div>
            <div className="truncate text-sm font-semibold tracking-tight tabular-nums text-destructive">
              {formatCurrency(stats.monthlyExpenses.value)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-sm text-muted-foreground">Savings rate</span>
          <span className="font-semibold tabular-nums">
            {formatPercentage(stats.savingsRate.value || 0)}
          </span>
        </div>
      </Card>

      <MobileCashFlowChart data={monthlyData} />
      <MobileSpendingBreakdown data={expenseData} />

      {recommendations.length > 0 && accounts.length > 0 && (
        <DashboardRecommendations
          recommendations={recommendations}
          accounts={accounts}
          categories={categories}
        />
      )}
    </div>
  );
}
