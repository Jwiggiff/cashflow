import { Skeleton } from "@/components/ui/skeleton";

function StackedRowSkeleton() {
  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        <Skeleton className="h-4 w-16 shrink-0" />
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3 @3xl:hidden">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-8 w-16" />
      </div>
    </li>
  );
}

/** Skeleton for Categories / Recurring stacked card lists. */
export function StackedListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="w-full space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <StackedRowSkeleton key={i} />
      ))}
    </ul>
  );
}

/** Skeleton for the Accounts accordion list. */
export function AccountsListSkeleton() {
  return (
    <div className="w-full space-y-2" aria-hidden>
      {[0, 1].map((section) => (
        <div key={section} className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between p-3">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="ml-auto h-5 w-24" />
              <Skeleton className="ml-auto h-3 w-10" />
            </div>
          </div>
          {section === 0 &&
            [0, 1, 2].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between gap-4 border-t p-3"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton for Transactions — list below `@3xl`, table above. */
export function TransactionsListSkeleton() {
  return (
    <div className="w-full" aria-hidden>
      <div className="flex items-center gap-2 py-4">
        <Skeleton className="h-9 max-w-sm flex-1" />
        <Skeleton className="h-9 w-24 shrink-0" />
      </div>

      <div className="overflow-hidden rounded-lg border @3xl:hidden">
        {[0, 1].map((group) => (
          <div key={group}>
            <Skeleton className="h-8 w-full rounded-none bg-muted/80" />
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="flex items-center gap-3 border-t px-4 py-3"
              >
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16 shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-md border @3xl:block">
        <div className="flex gap-4 border-b px-4 py-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex gap-4 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
