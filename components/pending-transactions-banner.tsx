"use client";

import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";

export function PendingTransactionsBanner({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }

  return (
    <Link
      href="/transactions/needs-account"
      className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 transition-colors hover:bg-amber-400 dark:bg-amber-600 dark:text-amber-50 dark:hover:bg-amber-500"
    >
      <AlertTriangleIcon className="size-4 shrink-0" aria-hidden />
      {count} {count === 1 ? "transaction" : "transactions"} need{count === 1 ? "s" : ""} an account
    </Link>
  );
}
