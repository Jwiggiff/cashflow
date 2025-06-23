import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Separator } from "@/components/ui/separator";
import prisma from "@/lib/prisma";

export default async function TransactionsPage() {
  const accounts = await prisma.account.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const transactions = await prisma.transaction.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      account: true,
    },
  });

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <TransactionDialog accounts={accounts} />
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <TransactionsTable transactions={transactions} accounts={accounts} />
      </div>
    </div>
  );
}
