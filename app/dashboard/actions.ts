"use server";

import prisma from "@/lib/prisma";
import { DashboardStats, ExpenseData, MonthlyData } from "@/lib/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get total balance across all accounts
  const totalBalance =
    (
      await prisma.account.aggregate({
        _sum: {
          balance: true,
        },
      })
    )._sum.balance || 0;

  // Get last month's total balance for comparison
  const lastMonthBalance =
    (
      await prisma.transaction.aggregate({
        where: {
          date: {
            lt: endOfLastMonth,
          },
        },
        _sum: {
          amount: true,
        },
      })
    )._sum.amount || 0;

  const balanceChange =
    ((totalBalance - lastMonthBalance) / lastMonthBalance) * 100;

  // Get monthly income (current month)
  const monthlyIncome =
    (
      await prisma.transaction.aggregate({
        where: {
          type: "INCOME",
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      })
    )._sum.amount || 0;

  // Get last month's income for comparison
  const lastMonthIncome =
    (
      await prisma.transaction.aggregate({
        where: {
          type: "INCOME",
          date: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: {
          amount: true,
        },
      })
    )._sum.amount || 0;

  const incomeChange =
    ((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100;

  // Get monthly expenses (current month)
  const monthlyExpenses =
    ((
      await prisma.transaction.aggregate({
        where: {
          type: "EXPENSE",
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      })
    )._sum.amount || 0) * -1;

  // Get last month's expenses for comparison
  const lastMonthExpenses =
    ((
      await prisma.transaction.aggregate({
        where: {
          type: "EXPENSE",
          date: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: {
          amount: true,
        },
      })
    )._sum.amount || 0) * -1;

  const expenseChange =
    ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;

  // Calculate savings rate
  const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;

  // Get last month's savings rate for comparison
  const lastSavingsRate =
    ((lastMonthIncome - lastMonthExpenses) / lastMonthIncome) * 100;
  const savingsRateChange = savingsRate - lastSavingsRate;

  return {
    totalBalance: {
      value: totalBalance,
      change: balanceChange,
    },
    monthlyIncome: {
      value: monthlyIncome,
      change: incomeChange,
    },
    monthlyExpenses: {
      value: monthlyExpenses,
      change: expenseChange,
    },
    savingsRate: {
      value: savingsRate,
      change: savingsRateChange,
    },
  };
}

export async function getMonthlyData(): Promise<MonthlyData[]> {
  const now = new Date();
  const months = [];

  // Get data for the last 6 months
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const income =
      (
        await prisma.transaction.aggregate({
          where: {
            type: "INCOME",
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        })
      )._sum.amount || 0;

    const expenses =
      (
        await prisma.transaction.aggregate({
          where: {
            type: "EXPENSE",
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        })
      )._sum.amount || 0;

    months.push({
      month: month.toLocaleDateString("en-US", { month: "short" }),
      income,
      expenses: expenses * -1,
    });
  }

  return months;
}

export async function getExpenseBreakdown(): Promise<ExpenseData[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const categories = await prisma.category.findMany();

  const expenses = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      type: "EXPENSE",
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return expenses.map((expense) => ({
    category: categories.find((c) => c.id === expense.categoryId)?.name ?? "",
    value: (expense._sum.amount || 0) * -1,
  }));
}
