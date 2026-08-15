"use client";

import { AccountDialog } from "@/components/accounts/account-dialog";
import { CSVImportButton } from "@/components/csv-dropzone-wrapper";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransferDialog } from "@/components/transactions/transfer-dialog";
import type { BankAccount, Category } from "@prisma/client";
import { CreditCardIcon } from "lucide-react";

type TransactionsEmptyStateProps = {
  hasData: boolean;
  accounts: { id: number; name: string }[];
  categories: { id: number; name: string; icon?: string | null }[];
  onClearFilters?: () => void;
};

export function TransactionsEmptyState({
  hasData,
  accounts,
  categories,
  onClearFilters,
}: TransactionsEmptyStateProps) {
  if (!hasData) {
    if (accounts.length === 0) {
      return (
        <div className="rounded-lg border px-4 py-12 text-center">
          <CreditCardIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No transactions yet</h3>
          <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
            Add an account first, then you can start recording income, expenses,
            and transfers.
          </p>
          <AccountDialog mode="add" trigger={<Button>Add account</Button>} />
        </div>
      );
    }

    return (
      <div className="rounded-lg border px-4 py-12 text-center">
        <CreditCardIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No transactions yet</h3>
        <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
          Record your first expense, income, or transfer to start building your
          history.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <TransactionDialog
            mode="add"
            accounts={accounts}
            categories={categories as Category[]}
            trigger={<Button>Add transaction</Button>}
          />
          <TransferDialog
            mode="add"
            accounts={accounts as BankAccount[]}
            trigger={<Button variant="outline">Add transfer</Button>}
          />
          <CSVImportButton />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border px-4 py-12 text-center">
      <CreditCardIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">No matching transactions</h3>
      <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
        Nothing matches your current filters. Try clearing them to see all
        activity.
      </p>
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
