"use client";

import { useFormatters } from "@/hooks/use-formatters";
import type { TransactionOrTransfer } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Row } from "@tanstack/react-table";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
} from "lucide-react";
import type { ReactNode } from "react";

export type TransactionListItem =
  | { type: "header"; date: string }
  | { type: "row"; row: Row<TransactionOrTransfer> };

/** Stacked, date-grouped list shown below the `@3xl` content breakpoint. */
export function TransactionList({
  items,
  onRowClick,
  emptyState,
}: {
  items: TransactionListItem[];
  onRowClick?: (item: TransactionOrTransfer) => void;
  emptyState?: ReactNode;
}) {
  const { formatCurrency, isPrivate } = useFormatters();

  if (items.length === 0) {
    return (
      <>
        {emptyState ?? (
          <div className="rounded-lg border px-4 py-10 text-center text-sm text-muted-foreground">
            No transactions found.
          </div>
        )}
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <ul>
        {items.map((item) => {
          if (item.type === "header") {
            return (
              <li
                key={`header-${item.date}`}
                className="border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground"
              >
                {new Date(item.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </li>
            );
          }

          const transaction = item.row.original;
          const isTransfer = transaction.type === "TRANSFER";
          const amount = transaction.amount;
          const title = isTransfer
            ? transaction.description?.trim() || "Transfer"
            : transaction.description;
          const detail = isTransfer
            ? `${transaction.fromAccount.name} → ${transaction.toAccount.name}`
            : [
                transaction.account.name,
                transaction.category?.name ?? "Uncategorized",
              ].join(" · ");

          return (
            <li key={item.row.id} className="border-b last:border-b-0">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
                onClick={() => onRowClick?.(transaction)}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted",
                    !isPrivate &&
                      !isTransfer &&
                      amount > 0 &&
                      "text-emerald-700 dark:text-emerald-400",
                    !isPrivate &&
                      !isTransfer &&
                      amount < 0 &&
                      "text-destructive"
                  )}
                >
                  {isPrivate || isTransfer ? (
                    <ArrowLeftRight className="size-4" aria-hidden />
                  ) : amount >= 0 ? (
                    <ArrowDownLeft className="size-4" aria-hidden />
                  ) : (
                    <ArrowUpRight className="size-4" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {detail}
                  </div>
                </div>
                <div
                  className={cn(
                    "shrink-0 text-right text-sm font-semibold tabular-nums",
                    !isPrivate &&
                      !isTransfer &&
                      amount > 0 &&
                      "text-emerald-700 dark:text-emerald-400",
                    !isPrivate &&
                      !isTransfer &&
                      amount < 0 &&
                      "text-destructive",
                    isTransfer && "text-muted-foreground"
                  )}
                >
                  {!isPrivate && !isTransfer && amount > 0
                    ? "+"
                    : !isPrivate && !isTransfer && amount < 0
                      ? "−"
                      : ""}
                  {formatCurrency(Math.abs(amount))}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
