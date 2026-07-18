import { AccountBalanceHistory } from "@/components/accounts/account-balance-history";
import { AccountDetailHeader } from "@/components/accounts/account-detail-header";
import { AccountSummaryCards } from "@/components/accounts/account-summary-cards";
import { RecentAccountActivity } from "@/components/accounts/recent-account-activity";
import { Separator } from "@/components/ui/separator";
import { buildAccountBalanceHistory } from "@/lib/balance-history";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import type { TransactionOrTransfer } from "@/lib/types";
import { notFound } from "next/navigation";

const RECENT_ACTIVITY_LIMIT = 8;

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accountId = Number(id);
  if (!Number.isInteger(accountId) || accountId <= 0) {
    notFound();
  }

  const user = await requireUser();
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      userId: user.id,
    },
    include: {
      aliases: true,
    },
  });

  if (!account) {
    notFound();
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const dateRange = {
    gte: startOfMonth,
    lt: startOfNextMonth,
  };

  const [
    snapshots,
    transactions,
    transfers,
    income,
    expenses,
    incomingTransfers,
    outgoingTransfers,
  ] = await Promise.all([
    prisma.balanceSnapshot.findMany({
      where: {
        accountId,
        userId: user.id,
      },
      orderBy: [{ recordedAt: "asc" }, { id: "asc" }],
    }),
    prisma.transaction.findMany({
      where: {
        accountId,
        account: { userId: user.id },
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
    }),
    prisma.transfer.findMany({
      where: {
        OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
        fromAccount: { userId: user.id },
        toAccount: { userId: user.id },
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: { date: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
    }),
    prisma.transaction.aggregate({
      where: {
        accountId,
        account: { userId: user.id },
        type: "INCOME",
        date: dateRange,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        accountId,
        account: { userId: user.id },
        type: "EXPENSE",
        date: dateRange,
      },
      _sum: { amount: true },
    }),
    prisma.transfer.aggregate({
      where: {
        toAccountId: accountId,
        fromAccount: { userId: user.id },
        toAccount: { userId: user.id },
        date: dateRange,
      },
      _sum: { amount: true },
    }),
    prisma.transfer.aggregate({
      where: {
        fromAccountId: accountId,
        fromAccount: { userId: user.id },
        toAccount: { userId: user.id },
        date: dateRange,
      },
      _sum: { amount: true },
    }),
  ]);

  const recentActivity: TransactionOrTransfer[] = [
    ...transactions,
    ...transfers.map((transfer) => ({
      ...transfer,
      type: "TRANSFER" as const,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT);

  const openingSnapshot =
    snapshots.filter((snapshot) => snapshot.recordedAt < startOfMonth).at(-1) ??
    snapshots.find((snapshot) => snapshot.recordedAt >= startOfMonth);
  const inflow =
    (income._sum.amount ?? 0) + (incomingTransfers._sum.amount ?? 0);
  const outflow =
    Math.abs(expenses._sum.amount ?? 0) +
    (outgoingTransfers._sum.amount ?? 0);
  const balanceChange = account.balance - (openingSnapshot?.balance ?? account.balance);
  const balanceHistory = buildAccountBalanceHistory(
    snapshots,
    account.createdAt,
    now
  );
  const trackingStartedAt = snapshots[0]?.recordedAt ?? account.createdAt;
  const lastBalanceChangeAt =
    snapshots.length > 1 ? snapshots[snapshots.length - 1].recordedAt : null;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AccountDetailHeader
        account={account}
        lastBalanceChangeAt={lastBalanceChangeAt}
        trackingStartedAt={trackingStartedAt}
      />

      <Separator />

      <main className="flex-1 space-y-6 p-8">
        <AccountSummaryCards
          inflow={inflow}
          outflow={outflow}
          balanceChange={balanceChange}
        />
        <AccountBalanceHistory data={balanceHistory} />
        <RecentAccountActivity
          accountId={account.id}
          items={recentActivity}
        />
      </main>
    </div>
  );
}
