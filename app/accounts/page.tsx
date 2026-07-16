import { AccountsList } from "@/components/accounts/accounts-list";
import { Separator } from "@/components/ui/separator";
import {
  buildAccountBalanceHistory,
  getBalanceHistoryStart,
} from "@/lib/balance-history";
import { getBalanceSnapshotsForAccounts } from "@/lib/balance-history-data";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";

export default async function AccountsPage() {
  const user = await requireUser();

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: user.id },
    include: {
      aliases: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const historyStart = getBalanceHistoryStart();
  const snapshots = await getBalanceSnapshotsForAccounts(
    accounts.map((account) => account.id),
    historyStart
  );
  const snapshotsByAccount = snapshots.reduce((byAccount, snapshot) => {
    const accountSnapshots = byAccount.get(snapshot.accountId) ?? [];
    accountSnapshots.push(snapshot);
    byAccount.set(snapshot.accountId, accountSnapshots);
    return byAccount;
  }, new Map<number, typeof snapshots>());
  const accountsWithHistory = accounts.map((account) => ({
    ...account,
    balanceHistory: buildAccountBalanceHistory(
      snapshotsByAccount.get(account.id) ?? [],
      historyStart
    ),
  }));

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Accounts</h1>
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <AccountsList accounts={accountsWithHistory} />
      </div>
    </div>
  );
}
