import { AccountsList } from "@/components/accounts/accounts-list";
import { AppPageHeader } from "@/components/app-page-header";
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

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppPageHeader title="Accounts" />

      <div className="flex-1 py-2 @3xl:p-8">
        <AccountsList accounts={accounts} />
      </div>
    </div>
  );
}
