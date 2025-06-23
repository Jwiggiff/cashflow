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
import { Account } from "@prisma/client";
import { deleteAccount } from "@/app/accounts/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AccountDialog } from "./account-dialog";

interface AccountActionsCellProps {
  account: Account;
}

export function AccountActionsCell({ account }: AccountActionsCellProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const result = await deleteAccount(account.id);
    setLoading(false);
    setOpen(false);
    if (result.success) {
      toast.success("Account deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete account");
    }
  }

  return (
    <div className="flex gap-2 justify-end">
      <AccountDialog
        mode="edit"
        account={account}
        trigger={
          <Button size="icon" variant="ghost" aria-label="Edit account">
            <PencilIcon className="h-4 w-4" />
          </Button>
        }
      />
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Delete account">
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </AlertDialogDescription>
            <div className="mt-4 p-3 rounded bg-muted text-sm">
              <div><span className="font-semibold">Name:</span> {account.name}</div>
              <div><span className="font-semibold">Type:</span> {account.type.charAt(0) + account.type.slice(1).toLowerCase()}</div>
              <div><span className="font-semibold">Balance:</span> ${account.balance.toFixed(2)}</div>
              <div><span className="font-semibold">Created:</span> {new Date(account.createdAt).toLocaleDateString()}</div>
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