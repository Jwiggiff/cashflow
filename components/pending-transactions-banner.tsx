"use client";

import Link from "next/link";
import { AlertTriangleIcon, ChevronRightIcon } from "lucide-react";

export function PendingTransactionsBanner({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }

  return (
    <Link
      href="/transactions/needs-account"
      className="animate-in fade-in-0 slide-in-from-top-2 fixed inset-x-4 top-4 z-40 flex items-center gap-3 rounded-2xl border bg-popover/90 p-3.5 pr-4 text-popover-foreground shadow-2xl ring-1 ring-black/5 backdrop-blur-xl transition-colors duration-300 hover:bg-popover/95 md:left-[calc(var(--sidebar-width)+1.5rem)] md:right-6 dark:ring-white/10"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
        <AlertTriangleIcon className="size-4.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">
          {count} {count === 1 ? "transaction" : "transactions"} need
          {count === 1 ? "s" : ""} an account
        </div>
        <div className="truncate text-xs text-muted-foreground">
          Tap to review and assign {count === 1 ? "it" : "them"}.
        </div>
      </div>
      <ChevronRightIcon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
