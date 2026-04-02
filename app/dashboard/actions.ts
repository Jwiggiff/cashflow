"use server";

import { auth } from "@/lib/auth";
import {
  detectRecurringPatternRecommendations,
  RECOMMENDATIONS_LOOKBACK_MONTHS,
  type DashboardRecurringPatternRecommendation,
} from "@/lib/recommendations/detect-recurring-patterns";
import { prisma } from "@/lib/prisma";
import { DashboardStats, ExpenseData, MonthlyData } from "@/lib/types";
import type { BankAccount, Category } from "@prisma/client";

export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await auth();
  if (!session?.user) {
    return {
      totalBalance: { value: 0, change: 0 },
      monthlyIncome: { value: 0, change: 0 },
      monthlyExpenses: { value: 0, change: 0 },
      savingsRate: { value: 0, change: 0 },
    };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get total balance across all accounts
  const totalBalance =
    (
      await prisma.bankAccount.aggregate({
        where: {
          userId: session.user.id,
        },
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
          account: {
            userId: session.user.id,
          },
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
          account: {
            userId: session.user.id,
          },
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
          account: {
            userId: session.user.id,
          },
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
          account: {
            userId: session.user.id,
          },
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
          account: {
            userId: session.user.id,
          },
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
  const session = await auth();
  if (!session?.user) {
    return [];
  }

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
            account: {
              userId: session.user.id,
            },
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
            account: {
              userId: session.user.id,
            },
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
  const session = await auth();
  if (!session?.user) {
    return [];
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const categories = await prisma.category.findMany();

  const expenses = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      account: {
        userId: session.user.id,
      },
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

export async function getDashboardRecommendations(): Promise<
  DashboardRecurringPatternRecommendation[]
> {
  const session = await auth();
  if (!session?.user) {
    return [];
  }

  const userId = session.user.id;
  const since = new Date();
  since.setMonth(since.getMonth() - RECOMMENDATIONS_LOOKBACK_MONTHS);

  const [
    transactions,
    transfers,
    existingRecurringTransactions,
    existingRecurringTransfers,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        account: { userId },
        date: { gte: since },
      },
      include: { account: true },
    }),
    prisma.transfer.findMany({
      where: {
        date: { gte: since },
        fromAccount: { userId },
        toAccount: { userId },
      },
      include: { fromAccount: true, toAccount: true },
    }),
    prisma.recurringTransaction.findMany({
      where: { account: { userId } },
      select: {
        accountId: true,
        type: true,
        amount: true,
        description: true,
      },
    }),
    prisma.recurringTransfer.findMany({
      where: {
        fromAccount: { userId },
        toAccount: { userId },
      },
      select: {
        fromAccountId: true,
        toAccountId: true,
        amount: true,
        description: true,
      },
    }),
  ]);

  return detectRecurringPatternRecommendations({
    transactions: transactions.map((t) => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      accountId: t.accountId,
      accountName: t.account.name,
    })),
    transfers: transfers.map((t) => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      fromAccountId: t.fromAccountId,
      toAccountId: t.toAccountId,
      fromAccountName: t.fromAccount.name,
      toAccountName: t.toAccount.name,
    })),
    existingRecurringTransactions,
    existingRecurringTransfers,
  });
}

export async function getAccountsAndCategoriesForRecurringDialogs(): Promise<{
  accounts: BankAccount[];
  categories: Category[];
}> {
  const session = await auth();
  if (!session?.user) {
    return { accounts: [], categories: [] };
  }

  const userId = session.user.id;
  const [accounts, categories] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  return { accounts, categories };
}
