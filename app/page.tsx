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
    <div className="flex-1 @3xl:p-8">
      <div className="space-y-4 @3xl:hidden">
        <div className="-mx-4 h-[310px] animate-pulse bg-muted" />
        <div className="-mx-4 h-32 animate-pulse bg-muted" />
        <div className="-mx-4 h-[290px] animate-pulse bg-muted" />
        <div className="-mx-4 h-[260px] animate-pulse bg-muted" />
      </div>

      <div className="hidden @3xl:block">
        <div className="mb-8 grid grid-cols-2 gap-4 @5xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="grid gap-4 @3xl:grid-cols-2 @5xl:grid-cols-7">
          <div className="h-[300px] animate-pulse rounded-lg bg-muted @3xl:col-span-2 @5xl:col-span-7" />
          <div className="h-[300px] animate-pulse rounded-lg bg-muted @5xl:col-span-4" />
          <div className="h-[300px] animate-pulse rounded-lg bg-muted @5xl:col-span-3" />
        </div>
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

      <Separator className="hidden @3xl:block" />

      <Suspense fallback={<Loading />}>
        <DashboardWrapper />
      </Suspense>
    </div>
  );
}
