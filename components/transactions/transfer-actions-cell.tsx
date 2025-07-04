"use client";

import { deleteTransfer } from "@/app/transactions/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { TransferWithAccounts } from "@/lib/types";
import { BankAccount } from "@prisma/client";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { TransferDialog } from "./transfer-dialog";

interface TransferActionsCellProps {
  transfer: TransferWithAccounts;
  accounts: BankAccount[];
}

export function TransferActionsCell({
  transfer,
  accounts,
}: TransferActionsCellProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const result = await deleteTransfer(transfer.id);
    setLoading(false);
    setOpen(false);
    if (result.success) {
      toast.success("Transfer deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete transfer");
    }
  }

  return (
    <div className="flex gap-2 justify-end">
      <TransferDialog
        mode="edit"
        transfer={transfer}
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
            <AlertDialogTitle>Delete Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transfer? This action cannot
              be undone.
            </AlertDialogDescription>
            <div className="mt-4 p-3 rounded bg-muted text-sm">
              <div>
                <span className="font-semibold">Amount:</span> $
                {Math.abs(transfer.amount).toFixed(2)}{" "}
                {transfer.amount < 0 ? "(Expense)" : ""}
              </div>
              <div>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(transfer.date).toLocaleDateString()}
              </div>
              <div>
                <span className="font-semibold">From Account:</span>{" "}
                {transfer.fromAccount.name}
              </div>
              <div>
                <span className="font-semibold">To Account:</span>{" "}
                {transfer.toAccount.name}
              </div>
              <div>
                <span className="font-semibold">Description:</span>{" "}
                {transfer.description || "No description"}
              </div>
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
