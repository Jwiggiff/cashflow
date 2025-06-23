import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { columns } from "@/components/transactions/columns";
import { DataTable } from "@/components/data-table";
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
        <AddTransactionDialog accounts={accounts} />
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <DataTable columns={columns} data={transactions} />
      </div>
    </div>
  );
}
