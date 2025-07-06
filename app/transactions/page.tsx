import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionOrTransfer } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user) {
    return redirect("/auth/signin");
  }

  const accounts = await prisma.bankAccount.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  const categories = await prisma.category.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  const transactions = await prisma.transaction.findMany({
    where: {
      account: {
        userId: session.user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      account: true,
      category: true,
    },
  });

  const transfers = await prisma.transfer.findMany({
    where: {
      fromAccount: {
        userId: session.user.id,
      },
      toAccount: {
        userId: session.user.id,
      },
    },
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
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Transactions</h1>
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <TransactionsTable
          items={allItems}
          accounts={accounts}
          categories={categories}
        />
      </div>
    </div>
  );
}
