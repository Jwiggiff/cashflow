import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { TransactionOrTransfer } from "@/lib/types";

export default async function TransactionsPage() {
  const accounts = await prisma.account.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const categories = await prisma.category.findMany({
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
      category: true,
    },
  });

  const transfers = await prisma.transfer.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      fromAccount: true,
      toAccount: true,
    },
  });

  // Combine transactions and transfers into a single array
  const allItems: TransactionOrTransfer[] = [
    ...transactions,
    ...transfers.map((t) => ({ ...t, type: "TRANSFER" })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Transactions</h1>
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <TransactionsTable items={allItems} accounts={accounts} categories={categories} />
      </div>
    </div>
  );
}
