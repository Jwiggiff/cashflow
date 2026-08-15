import { AppPageHeader } from "@/components/app-page-header";
import { StackedListSkeleton } from "@/components/page-list-skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppPageHeader title="Categories" />
      <div className="flex-1 py-2 @3xl:p-8">
        <StackedListSkeleton />
      </div>
    </div>
  );
}
