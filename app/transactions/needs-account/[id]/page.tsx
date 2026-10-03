import { AppPageHeader } from "@/components/app-page-header";
import {
  getPendingTransaction,
  getPendingTransactionCount,
} from "@/app/transactions/actions";
import { NeedsAccountForm } from "@/components/transactions/needs-account-form";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function NeedsAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const transactionId = Number(id);

  if (!Number.isInteger(transactionId)) {
    redirect("/transactions/needs-account");
  }

  const [transaction, accounts, remainingCount] = await Promise.all([
    getPendingTransaction(transactionId),
    prisma.bankAccount.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    getPendingTransactionCount(),
  ]);

  if (!transaction) {
    redirect("/transactions/needs-account");
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppPageHeader title="Needs an Account" />
      <NeedsAccountForm
        transaction={transaction}
        accounts={accounts}
        remainingCount={remainingCount}
      />
    </div>
  );
}
