import DashboardWrapper from "@/components/dashboard/dashboard-wrapper";
import { Header } from "@/components/dashboard/header";
import { Welcome } from "@/components/dashboard/welcome";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const Loading = () => {
  return (
    <div className="flex-1 p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-[300px] bg-muted animate-pulse rounded-lg" />
        <div className="col-span-3 h-[300px] bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
};

export default async function Home() {
  const session = await auth();

  if (!session) {
    const numUsers = await prisma.user.count();
    if (numUsers === 0) {
      redirect("/auth/signup");
    } else {
      redirect("/auth/signin");
    }
    return;
  }

  const numAccounts = await prisma.bankAccount.count({
    where: { userId: session.user.id },
  });

  if (numAccounts === 0) {
    return <Welcome />;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />

      <Separator />

      <Suspense fallback={<Loading />}>
        <DashboardWrapper />
      </Suspense>
    </div>
  );
}
