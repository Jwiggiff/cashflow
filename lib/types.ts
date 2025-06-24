import { Prisma } from "@prisma/client";

export type TransactionWithAccount = Prisma.TransactionGetPayload<{
  include: { account: true };
}>;

export type TransferWithAccounts = Prisma.TransferGetPayload<{
  include: { fromAccount: true; toAccount: true };
}>;

export type TransactionOrTransfer =
  | TransactionWithAccount
  | (TransferWithAccounts & { type: string });

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
