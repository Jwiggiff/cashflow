"use client";

import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DollarSign, TrendingUp, PiggyBank, TrendingDown } from "lucide-react";
import {
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid,
  PieChart,
  Pie,
} from "recharts";
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getMonthlyData,
  getExpenseBreakdown,
} from "./dashboard/actions";
import { DashboardStats, ExpenseData, MonthlyData } from "@/lib/types";
import {
  ChartLegendContent,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartContainer } from "@/components/ui/chart";
import {
  formatCurrency,
  formatChange,
  formatPercentage,
  capitalize,
  slugify,
} from "@/lib/utils";
import { CurrencyTooltipFormatter } from "@/components/dashboard/currency-tooltip-formatter";

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, monthlyDataResult, expenseDataResult] =
          await Promise.all([
            getDashboardStats(),
            getMonthlyData(),
            getExpenseBreakdown(),
          ]);

        setStats(statsData);
        setMonthlyData(monthlyDataResult);
        setExpenseData(expenseDataResult);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <div className="flex items-center justify-between p-8">
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
        <Separator />
        <div className="flex-1 p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 h-[300px] bg-muted animate-pulse rounded-lg" />
            <div className="col-span-3 h-[300px] bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const expenseConfig = expenseData.reduce((acc, expense, index) => {
    acc[expense.category] = {
      label: capitalize(expense.category),
      color: `var(--chart-${index + 1})`,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  console.log(expenseConfig);

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      <Separator />

      <div className="flex-1 p-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
          <ChartCard title="Monthly Overview" className="col-span-4">
            <ChartContainer
              className="aspect-auto h-full w-full min-h-[300px]"
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

          <ChartCard title="Expense Breakdown" className="col-span-3">
            <ChartContainer
              config={expenseConfig}
              className="aspect-square h-full w-full mx-auto max-h-[300px]"
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
                  }))}
                  dataKey="value"
                  nameKey="category"
                  stroke="0"
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="category" />}
                />
              </PieChart>
            </ChartContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
