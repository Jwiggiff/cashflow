import { AccountsList } from "@/components/accounts/accounts-list";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user) {
    return <div>Unauthorized</div>;
  }

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id },
    include: {
      aliases: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Accounts</h1>
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <AccountsList accounts={accounts} />
      </div>
    </div>
  );
}
