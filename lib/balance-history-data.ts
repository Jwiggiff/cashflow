import type { BalanceSnapshotRecord } from "@/lib/balance-history";
import { prisma } from "@/lib/prisma";

const snapshotSelect = {
  id: true,
  accountId: true,
  balance: true,
  recordedAt: true,
} as const;

export async function getBalanceSnapshotsForAccounts(
  accountIds: number[],
  startDate: Date,
  userId: string
): Promise<BalanceSnapshotRecord[]> {
  if (accountIds.length === 0) {
    return [];
  }

  const [recentSnapshots, openingSnapshots] = await Promise.all([
    prisma.balanceSnapshot.findMany({
      where: {
        accountId: { in: accountIds },
        userId,
        recordedAt: { gte: startDate },
      },
      select: snapshotSelect,
      orderBy: [{ recordedAt: "asc" }, { id: "asc" }],
    }),
    Promise.all(
      accountIds.map((accountId) =>
        prisma.balanceSnapshot.findFirst({
          where: {
            accountId,
            userId,
            recordedAt: { lt: startDate },
          },
          select: snapshotSelect,
          orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
        })
      )
    ),
  ]);

  return [
    ...openingSnapshots.filter(
      (snapshot): snapshot is BalanceSnapshotRecord => snapshot !== null
    ),
    ...recentSnapshots,
  ];
}

export async function getBalanceSnapshotsForUser(
  userId: string,
  startDate: Date
): Promise<BalanceSnapshotRecord[]> {
  const snapshotAccounts = await prisma.balanceSnapshot.groupBy({
    by: ["accountId"],
    where: { userId },
  });

  return getBalanceSnapshotsForAccounts(
    snapshotAccounts.map(({ accountId }) => accountId),
    startDate,
    userId
  );
}
