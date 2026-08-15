"use client";

import { toggleRecurringItemActive } from "@/app/recurring/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/formatter";
import { RecurringTransactionOrTransfer } from "@/lib/types";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { useFormatters } from "@/hooks/use-formatters";
import {
  BankAccount,
  Category,
  RecurringTransaction,
  RecurringTransfer,
} from "@prisma/client";
import {
  ArrowLeftRight,
  ArrowRightIcon,
  PencilIcon,
  RepeatIcon,
} from "lucide-react";
import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RRule } from "rrule";
import { toast } from "sonner";
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

function getItemTitle(item: RecurringTransactionOrTransfer) {
  if (item.type === "RECURRING_TRANSFER") {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate">{item.fromAccount.name}</span>
        <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{item.toAccount.name}</span>
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {item.category?.icon && (
        <DynamicIcon
          name={item.category.icon as keyof typeof dynamicIconImports}
          className="size-4 shrink-0"
        />
      )}
      <span className="truncate">{item.description}</span>
    </span>
  );
}

export function RecurringList({
  recurringTransactions,
  recurringTransfers,
  accounts,
  categories,
}: RecurringListProps) {
  const { formatCurrency, isPrivate } = useFormatters();
  const router = useRouter();
  const [loadingToggles, setLoadingToggles] = useState<Record<string, boolean>>(
    {}
  );

  const [createTransactionOpen, setCreateTransactionOpen] = useState(false);
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

  const refresh = () => router.refresh();

  const handleToggle = async (
    item: RecurringTransactionOrTransfer,
    checked: boolean
  ) => {
    const isTransfer = item.type === "RECURRING_TRANSFER";
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
      refresh();
    } catch (error) {
      console.error("Failed to toggle recurring item:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setLoadingToggles((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (allItems.length === 0) {
    return (
      <>
        <div className="py-12 text-center">
          <RepeatIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No recurring items</h3>
          <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
            Set up repeating income, bills, or transfers so CashFlow can track
            them automatically.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => setCreateTransactionOpen(true)}>
              Add recurring transaction
            </Button>
            <RecurringTransferDialog
              accounts={accounts}
              mode="add"
              trigger={<Button variant="outline">Add transfer</Button>}
              onSuccess={refresh}
            />
          </div>
        </div>

        <RecurringTransactionDialog
          open={createTransactionOpen}
          onOpenChange={setCreateTransactionOpen}
          accounts={accounts}
          categories={categories}
          onSuccess={() => {
            setCreateTransactionOpen(false);
            refresh();
          }}
        />
      </>
    );
  }

  return (
    <>
      <ul className="w-full space-y-3">
        {allItems.map((item) => {
          const isTransfer = item.type === "RECURRING_TRANSFER";
          const key = `${item.type}-${item.id}`;
          const frequency = capitalizeFirstLetter(
            RRule.fromString(item.rrule).toText()
          );
          const accountLabel = isTransfer
            ? item.description?.trim() &&
              item.description.trim().toLowerCase() !== "transfer"
              ? item.description
              : "Transfer"
            : item.account.name;
          const lastLabel = item.lastProcessedDate
            ? formatDate(item.lastProcessedDate, { dateStyle: "short" })
            : "Never";
          const nextLabel = formatDate(item.nextDueDate, {
            dateStyle: "short",
          });
          const amountClass = cn(
            "font-semibold tabular-nums",
            !isPrivate &&
              !isTransfer &&
              item.type === "INCOME" &&
              "text-emerald-700 dark:text-emerald-400",
            !isPrivate &&
              !isTransfer &&
              item.type === "EXPENSE" &&
              "text-destructive"
          );

          return (
            <li
              key={key}
              className={cn(
                "rounded-lg border bg-card p-4",
                !item.isActive && "opacity-60"
              )}
            >
              <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {isTransfer ? (
                      <ArrowLeftRight className="size-4" aria-hidden />
                    ) : (
                      <RepeatIcon className="size-4" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium @3xl:text-base">
                      {getItemTitle(item)}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {frequency} · {accountLabel}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      Next {nextLabel} · Last {lastLabel}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "shrink-0 text-right text-sm @3xl:hidden",
                      amountClass
                    )}
                  >
                    {formatCurrency(
                      isTransfer ? item.amount : Math.abs(item.amount)
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t pt-3 @3xl:border-t-0 @3xl:pt-0">
                  <div className="hidden text-right @3xl:block">
                    <div className={amountClass}>
                      {formatCurrency(
                        isTransfer ? item.amount : Math.abs(item.amount)
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {accountLabel}
                    </div>
                  </div>

                  <div className="flex flex-1 items-center justify-between gap-2 @3xl:flex-initial @3xl:justify-end">
                    <span className="text-sm text-muted-foreground @3xl:hidden">
                      Active
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.isActive}
                        disabled={loadingToggles[key]}
                        onCheckedChange={(checked) =>
                          handleToggle(item, checked)
                        }
                        aria-label={
                          item.isActive
                            ? `Disable ${isTransfer ? "transfer" : "transaction"}`
                            : `Enable ${isTransfer ? "transfer" : "transaction"}`
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={
                          isTransfer
                            ? "Edit recurring transfer"
                            : "Edit recurring transaction"
                        }
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
                        <PencilIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {editingTransaction && (
        <RecurringTransactionDialog
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          accounts={accounts}
          categories={categories}
          recurringTransaction={editingTransaction}
          onSuccess={() => {
            setEditingTransaction(null);
            refresh();
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
            refresh();
          }}
        />
      )}
    </>
  );
}
