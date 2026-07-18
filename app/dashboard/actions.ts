"use server";

import { auth } from "@/lib/auth";
import {
  detectRecurringPatternRecommendations,
  RECOMMENDATIONS_LOOKBACK_MONTHS,
  type DashboardRecurringPatternRecommendation,
} from "@/lib/recommendations/detect-recurring-patterns";
import {
  buildNetWorthHistory,
  getBalanceHistoryStart,
} from "@/lib/balance-history";
import { getBalanceSnapshotsForUser } from "@/lib/balance-history-data";
import { prisma } from "@/lib/prisma";
import {
  BalanceHistoryPoint,
  DashboardStats,
  ExpenseData,
  MonthlyData,
} from "@/lib/types";
import type { BankAccount, Category } from "@prisma/client";

function calculatePercentChange(current: number, previous: number) {
  if (previous === 0) {
    return 0;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

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
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

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

  const balanceSnapshots = await getBalanceSnapshotsForUser(
    session.user.id,
    startOfMonth
  );
  const openingBalances = new Map<number, number>();
  for (const snapshot of balanceSnapshots) {
    if (snapshot.recordedAt < startOfMonth) {
      openingBalances.set(snapshot.accountId, snapshot.balance);
    }
  }
  const openingNetWorth =
    openingBalances.size > 0
      ? Array.from(openingBalances.values()).reduce(
          (sum, balance) => sum + balance,
          0
        )
      : totalBalance;
  const balanceChange = calculatePercentChange(totalBalance, openingNetWorth);

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
            lt: startOfNextMonth,
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
            lt: startOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      })
    )._sum.amount || 0;

  const incomeChange = calculatePercentChange(monthlyIncome, lastMonthIncome);

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
            lt: startOfNextMonth,
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
            lt: startOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      })
    )._sum.amount || 0) * -1;

  const expenseChange = calculatePercentChange(
    monthlyExpenses,
    lastMonthExpenses
  );

  // Calculate savings rate
  const savingsRate =
    monthlyIncome === 0
      ? 0
      : ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;

  // Get last month's savings rate for comparison
  const lastSavingsRate =
    lastMonthIncome === 0
      ? 0
      : ((lastMonthIncome - lastMonthExpenses) / lastMonthIncome) * 100;
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

export async function getNetWorthHistory(): Promise<BalanceHistoryPoint[]> {
  const session = await auth();
  if (!session?.user) {
    return [];
  }

  const historyStart = getBalanceHistoryStart();
  const snapshots = await getBalanceSnapshotsForUser(
    session.user.id,
    historyStart
  );

  return buildNetWorthHistory(snapshots, historyStart);
}

export async function getMonthlyData(): Promise<MonthlyData[]> {
  const session = await auth();
  if (!session?.user) {
    return [];
  }

  const now = new Date();
  const monthDates = Array.from({ length: 12 }, (_, index) => {
    return new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
  });
  const startDate = monthDates[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const transactions = await prisma.transaction.findMany({
    where: {
      account: { userId: session.user.id },
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      date: true,
      amount: true,
      type: true,
    },
  });
  const monthlyData = monthDates.map((month) => {
    return {
      key: `${month.getFullYear()}-${month.getMonth()}`,
      month: month.toLocaleDateString("en-US", { month: "short" }),
      income: 0,
      expenses: 0,
    };
  });
  const dataByMonth = new Map(
    monthlyData.map((month) => [month.key, month])
  );

  for (const transaction of transactions) {
    const key = `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`;
    const month = dataByMonth.get(key);
    if (!month) {
      continue;
    }

    if (transaction.type === "INCOME") {
      month.income += transaction.amount;
    } else {
      month.expenses += transaction.amount * -1;
    }
  }

  return monthlyData.map(({ month, income, expenses }) => ({
    month,
    income,
    expenses,
  }));
}

export async function getExpenseBreakdown(): Promise<ExpenseData[]> {
  const session = await auth();
  if (!session?.user) {
    return [];
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
  });

  const expenses = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      account: {
        userId: session.user.id,
      },
      type: "EXPENSE",
      date: {
        gte: startOfMonth,
        lt: startOfNextMonth,
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
