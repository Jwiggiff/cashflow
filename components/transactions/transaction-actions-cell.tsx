"use client";

import { Button } from "@/components/ui/button";
import { Trash2Icon, PencilIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import * as React from "react";
import { TransactionWithAccount } from "@/lib/types";
import { deleteTransaction } from "@/app/transactions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TransactionDialog } from "./transaction-dialog";

interface TransactionActionsCellProps {
  transaction: TransactionWithAccount;
  accounts: { id: number; name: string; }[];
}

export function TransactionActionsCell({ transaction, accounts }: TransactionActionsCellProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const result = await deleteTransaction(transaction.id);
    setLoading(false);
    setOpen(false);
    if (result.success) {
      toast.success("Transaction deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete transaction");
    }
  }

  return (
    <div className="flex gap-2 justify-end">
      <TransactionDialog
        mode="edit"
        transaction={transaction}
        accounts={accounts}
        trigger={
          <Button size="icon" variant="ghost" aria-label="Edit transaction">
            <PencilIcon className="h-4 w-4" />
          </Button>
        }
      />
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Delete transaction">
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
            <div className="mt-4 p-3 rounded bg-muted text-sm">
              <div><span className="font-semibold">Description:</span> {transaction.description}</div>
              <div><span className="font-semibold">Amount:</span> ${Math.abs(transaction.amount).toFixed(2)} {transaction.amount < 0 ? '(Expense)' : ''}</div>
              <div><span className="font-semibold">Date:</span> {new Date(transaction.date).toLocaleDateString()}</div>
              <div><span className="font-semibold">Account:</span> {transaction.account.name}</div>
              <div><span className="font-semibold">Category:</span> {transaction.category}</div>
              <div><span className="font-semibold">Type:</span> {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}</div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 