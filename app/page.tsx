"use client";

import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DollarSign, Wallet, TrendingUp, PiggyBank } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { PieChart, Pie, Cell } from "recharts";

const monthlyData = [
  { month: "Jan", income: 12000, expenses: 8000 },
  { month: "Feb", income: 12500, expenses: 8200 },
  { month: "Mar", income: 13000, expenses: 8500 },
  { month: "Apr", income: 12800, expenses: 8300 },
  { month: "May", income: 13200, expenses: 8400 },
  { month: "Jun", income: 13500, expenses: 8600 },
];

const expenseData = [
  { name: "Housing", value: 2500 },
  { name: "Food", value: 1200 },
  { name: "Transport", value: 800 },
  { name: "Utilities", value: 600 },
  { name: "Entertainment", value: 400 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function Home() {
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
            value="$45,231.89"
            change="+20.1% from last month"
            icon={DollarSign}
          />

          <StatCard
            title="Monthly Income"
            value="$12,234"
            change="+4.3% from last month"
            icon={TrendingUp}
          />

          <StatCard
            title="Monthly Expenses"
            value="$8,234"
            change="-2.1% from last month"
            icon={Wallet}
          />

          <StatCard
            title="Savings Rate"
            value="32.7%"
            change="+5.2% from last month"
            icon={PiggyBank}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <ChartCard title="Monthly Overview" className="col-span-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="income" fill="#0088FE" name="Income" />
                  <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Expense Breakdown" className="col-span-3">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {expenseData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
