import { AccountDialog } from "@/components/accounts/account-dialog";
import { AccountsList } from "@/components/accounts/accounts-list";
import { Separator } from "@/components/ui/separator";
import prisma from "@/lib/prisma";

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <AccountDialog />
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <AccountsList accounts={accounts} />
      </div>
    </div>
  );
}
