import { RecurringList } from "@/components/recurring/recurring-list";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function RecurringPage() {
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

  const recurringTransactions = await prisma.recurringTransaction.findMany({
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

  const recurringTransfers = await prisma.recurringTransfer.findMany({
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

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Recurring</h1>
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <RecurringList
          recurringTransactions={recurringTransactions}
          recurringTransfers={recurringTransfers}
          accounts={accounts}
          categories={categories}
        />
      </div>
    </div>
  );
}
