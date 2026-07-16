import type { BalanceSnapshotRecord } from "@/lib/balance-history";
import { prisma } from "@/lib/prisma";

const snapshotSelect = {
  accountId: true,
  balance: true,
  recordedAt: true,
} as const;

export async function getBalanceSnapshotsForAccounts(
  accountIds: number[],
  startDate: Date
): Promise<BalanceSnapshotRecord[]> {
  if (accountIds.length === 0) {
    return [];
  }

  const [recentSnapshots, openingSnapshots] = await Promise.all([
    prisma.balanceSnapshot.findMany({
      where: {
        accountId: { in: accountIds },
        recordedAt: { gte: startDate },
      },
      select: snapshotSelect,
      orderBy: { recordedAt: "asc" },
    }),
    Promise.all(
      accountIds.map((accountId) =>
        prisma.balanceSnapshot.findFirst({
          where: {
            accountId,
            recordedAt: { lt: startDate },
          },
          select: snapshotSelect,
          orderBy: { recordedAt: "desc" },
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
