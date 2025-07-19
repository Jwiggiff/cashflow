"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DashboardStats, ExpenseData, MonthlyData } from "@/lib/types";
import { capitalize } from "@/lib/utils";
import { DollarSign, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { formatChange } from "@/lib/formatter";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "./chart-card";
import { CurrencyTooltipFormatter } from "./currency-tooltip-formatter";
import { StatCard } from "./stat-card";

export interface DashboardProps {
  stats: DashboardStats;
  monthlyData: MonthlyData[];
  expenseData: ExpenseData[];
}

export default function Dashboard({
  stats,
  monthlyData,
  expenseData,
}: DashboardProps) {
  const { formatCurrency, formatPercentage } = useFormatters();
  
  const expenseConfig = expenseData.reduce((acc, expense, index) => {
    acc[expense.category] = {
      label: capitalize(expense.category),
      color: `var(--chart-${index + 1})`,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <div className="flex-1 p-8">
      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Balance"
          value={formatCurrency(stats?.totalBalance.value || 0)}
          change={formatChange(stats?.totalBalance.change || 0)}
          icon={DollarSign}
        />

        <StatCard
          title="Monthly Income"
          value={formatCurrency(stats?.monthlyIncome.value || 0)}
          change={formatChange(stats?.monthlyIncome.change || 0)}
          icon={TrendingUp}
        />

        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(stats?.monthlyExpenses.value || 0)}
          change={formatChange(stats?.monthlyExpenses.change || 0)}
          icon={TrendingDown}
        />

        <StatCard
          title="Savings Rate"
          value={formatPercentage(stats?.savingsRate.value || 0)}
          change={formatChange(stats?.savingsRate.change || 0)}
          icon={PiggyBank}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <ChartCard title="Monthly Overview" className="lg:col-span-4">
          <ChartContainer
            className="aspect-auto h-full w-full min-h-[200px] md:min-h-[300px]"
            config={{
              income: {
                label: "Income",
                color: "var(--chart-2)",
                // color: "#0088FE",
              },
              expenses: {
                label: "Expenses",
                color: "var(--destructive)",
                // color: "#FF8042",
              },
            }}
          >
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-income)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-expenses)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-expenses)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => formatCurrency(value)}
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
                type="natural"
                fill="url(#fillIncome)"
                stroke="var(--color-income)"
                stackId="a"
              />
              <Area
                dataKey="expenses"
                type="natural"
                fill="url(#fillExpenses)"
                stroke="var(--color-expenses)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Expense Breakdown" className="lg:col-span-3">
          <ChartContainer
            config={expenseConfig}
            className="aspect-square h-full w-full mx-auto max-h-[200px] md:max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(_, __, item) => (
                      <CurrencyTooltipFormatter item={item} />
                    )}
                  />
                }
              />
              <Pie
                data={expenseData.map((expense, index) => ({
                  ...expense,
                  fill: `var(--chart-${index + 1})`,
                  fillOpacity: 0.8,
                }))}
                dataKey="value"
                nameKey="category"
                stroke="0"
              />
              <ChartLegend
                className="overflow-x-auto max-w-full whitespace-nowrap pb-4"
                content={<ChartLegendContent nameKey="category" />}
              />
            </PieChart>
          </ChartContainer>
        </ChartCard>
      </div>
    </div>
  );
}
