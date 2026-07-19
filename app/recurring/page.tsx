import { AppPageHeader } from "@/components/app-page-header";
import { RecurringList } from "@/components/recurring/recurring-list";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";

export default async function RecurringPage() {
  const user = await requireUser();

  const accounts = await prisma.bankAccount.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  const categories = await prisma.category.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  const recurringTransactions = await prisma.recurringTransaction.findMany({
    where: {
      account: {
        userId: user.id,
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
        userId: user.id,
      },
      toAccount: {
        userId: user.id,
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
    <div className="flex min-h-screen w-full flex-col">
      <AppPageHeader title="Recurring" />

      <div className="flex-1 py-2 @3xl:p-8">
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
