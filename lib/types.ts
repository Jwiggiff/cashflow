import { Category, Prisma } from "@prisma/client";

export type TransactionWithAccountAndCategory = Prisma.TransactionGetPayload<{
  include: { account: true; category: true };
}>;

export type TransferWithAccounts = Prisma.TransferGetPayload<{
  include: { fromAccount: true; toAccount: true };
}>;

export type TransactionOrTransfer =
  | TransactionWithAccountAndCategory
  | (TransferWithAccounts & { type: string });

export type AccountWithAliases = Prisma.BankAccountGetPayload<{
  include: { aliases: true };
}>;

export type DashboardStat = {
  value: number;
  change: number;
};

export type DashboardStats = {
  totalBalance: DashboardStat;
  monthlyIncome: DashboardStat;
  monthlyExpenses: DashboardStat;
  savingsRate: DashboardStat;
};

export type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
};

export type ExpenseData = {
  category: string;
  value: number;
};

export type CategoryWithData = Category & {
  currentMonthSpent: number;
  transactionCount: number;
};