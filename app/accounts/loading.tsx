import { AppPageHeader } from "@/components/app-page-header";
import { AccountsListSkeleton } from "@/components/page-list-skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppPageHeader title="Accounts" />
      <div className="flex-1 py-2 @3xl:p-8">
        <AccountsListSkeleton />
      </div>
    </div>
  );
}
