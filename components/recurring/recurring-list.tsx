"use client";

import {
  BankAccount,
  Category,
  RecurringTransaction,
  RecurringTransfer,
} from "@prisma/client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic";
import { useFormatters } from "@/hooks/use-formatters";
import { Switch } from "@/components/ui/switch";
import {
  ArrowRightIcon,
  CalendarIcon,
  PencilIcon,
  RepeatIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatter";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { RRule } from "rrule";
import { RecurringTransactionOrTransfer } from "@/lib/types";
import { toggleRecurringItemActive } from "@/app/recurring/actions";
import { RecurringTransactionDialog } from "./recurring-transaction-dialog";
import { RecurringTransferDialog } from "./recurring-transfer-dialog";

interface RecurringListProps {
  recurringTransactions: (RecurringTransaction & {
    account: BankAccount;
    category: Category | null;
  })[];
  recurringTransfers: (RecurringTransfer & {
    fromAccount: BankAccount;
    toAccount: BankAccount;
  })[];
  accounts: BankAccount[];
  categories: Category[];
}

export function RecurringList({
  recurringTransactions,
  recurringTransfers,
  accounts,
  categories,
}: RecurringListProps) {
  const { formatCurrency } = useFormatters();
  const router = useRouter();
  const [loadingToggles, setLoadingToggles] = useState<Record<string, boolean>>(
    {}
  );

  // State for edit dialogs
  const [editingTransaction, setEditingTransaction] = useState<
    | (RecurringTransaction & {
        account: BankAccount;
        category: Category | null;
      })
    | null
  >(null);
  const [editingTransfer, setEditingTransfer] = useState<
    | (RecurringTransfer & {
        fromAccount: BankAccount;
        toAccount: BankAccount;
      })
    | null
  >(null);

  const allItems: RecurringTransactionOrTransfer[] = [
    ...recurringTransactions,
    ...recurringTransfers.map((rt) => ({
      ...rt,
      type: "RECURRING_TRANSFER" as const,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <RepeatIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No recurring items</h3>
        <p className="text-muted-foreground">
          Create your first recurring transaction or transfer to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full space-y-4">
        {allItems.map((item) => {
          const isTransfer = item.type === "RECURRING_TRANSFER";
          const frequency = capitalizeFirstLetter(
            RRule.fromString(item.rrule).toText()
          );

          return (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex-1">
                <div className="font-medium text-lg flex items-center gap-2">
                  {isTransfer ? (
                    <>
                      <span>{item.fromAccount.name}</span>
                      <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.toAccount.name}</span>
                    </>
                  ) : (
                    <>
                      {item.category?.icon && (
                        <DynamicIcon
                          name={
                            item.category
                              .icon as keyof typeof dynamicIconImports
                          }
                          className="h-4 w-4"
                        />
                      )}
                      {item.description}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <RepeatIcon className="h-3 w-3" />
                    {frequency}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    Last:{" "}
                    {item.lastProcessedDate
                      ? formatDate(item.lastProcessedDate, {
                          dateStyle: "short",
                        })
                      : "Never"}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    Next: {formatDate(item.nextDueDate, { dateStyle: "short" })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div
                    className={cn(
                      "font-semibold",
                      !isTransfer && item.type === "EXPENSE"
                        ? "text-red-600"
                        : "text-green-600"
                    )}
                  >
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isTransfer ? "Transfer" : item.account.name}
                  </div>
                </div>

                <Switch
                  checked={item.isActive}
                  disabled={loadingToggles[`${item.type}-${item.id}`]}
                  onCheckedChange={async (checked) => {
                    const key = `${item.type}-${item.id}`;
                    setLoadingToggles((prev) => ({ ...prev, [key]: true }));
                    try {
                      const result = await toggleRecurringItemActive(
                        isTransfer ? "transfer" : "transaction",
                        item.id,
                        checked
                      );
                      if (!result.success) {
                        throw new Error(result.error);
                      }
                      toast.success(
                        `${isTransfer ? "Transfer" : "Transaction"} ${
                          checked ? "enabled" : "disabled"
                        } successfully`
                      );
                      router.refresh();
                    } catch (error) {
                      console.error("Failed to toggle recurring item:", error);
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Failed to update status"
                      );
                    } finally {
                      setLoadingToggles((prev) => ({ ...prev, [key]: false }));
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (isTransfer) {
                      setEditingTransfer(
                        item as RecurringTransfer & {
                          fromAccount: BankAccount;
                          toAccount: BankAccount;
                        }
                      );
                    } else {
                      setEditingTransaction(
                        item as RecurringTransaction & {
                          account: BankAccount;
                          category: Category | null;
                        }
                      );
                    }
                  }}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Dialogs */}
      {editingTransaction && (
        <RecurringTransactionDialog
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          accounts={accounts}
          categories={categories}
          recurringTransaction={editingTransaction}
          onSuccess={() => {
            setEditingTransaction(null);
            window.location.reload();
          }}
        />
      )}

      {editingTransfer && (
        <RecurringTransferDialog
          open={!!editingTransfer}
          onOpenChange={(open) => !open && setEditingTransfer(null)}
          accounts={accounts}
          mode="edit"
          recurringTransfer={editingTransfer}
          onSuccess={() => {
            setEditingTransfer(null);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
