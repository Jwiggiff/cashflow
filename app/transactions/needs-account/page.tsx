import { AppPageHeader } from "@/components/app-page-header";
import { getFirstPendingTransactionId } from "@/app/transactions/actions";
import { requireUser } from "@/lib/require-auth";
import { CircleCheckBig } from "lucide-react";
import { redirect } from "next/navigation";

export default async function NeedsAccountIndexPage() {
  await requireUser();

  const nextId = await getFirstPendingTransactionId();
  if (nextId) {
    redirect(`/transactions/needs-account/${nextId}`);
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppPageHeader title="Needs an Account" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
        <CircleCheckBig className="size-10" aria-hidden />
        <p>You&apos;re all caught up - no transactions need an account.</p>
      </div>
    </div>
  );
}
