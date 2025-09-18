"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useState } from "react";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/currency-input";
import {
  createTransfer,
  deleteTransfer,
  updateTransfer,
} from "@/app/transactions/actions";
import { useRouter } from "next/navigation";
import { Transfer, BankAccount } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";

interface TransferWithAccounts extends Transfer {
  fromAccount: BankAccount;
  toAccount: BankAccount;
}

interface TransferDialogProps {
  accounts: BankAccount[];
  mode?: "add" | "edit";
  transfer?: TransferWithAccounts;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function TransferDialog({
  accounts,
  mode = "add",
  transfer,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: TransferDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [amount, setAmount] = useState(transfer?.amount || 0);
  const [description, setDescription] = useState(transfer?.description || "");
  const [fromAccountId, setFromAccountId] = useState<number | "">(
    transfer?.fromAccountId || ""
  );
  const [toAccountId, setToAccountId] = useState<number | "">(
    transfer?.toAccountId || ""
  );
  const [date, setDate] = useState<Date>(transfer?.date || new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  // Check if accounts are the same for validation
  const isSameAccount =
    fromAccountId !== "" && toAccountId !== "" && fromAccountId === toAccountId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !fromAccountId || !toAccountId) return;

    if (isSameAccount) {
      toast.error("From and To accounts must be different");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        description: description || undefined,
        amount: amount,
        fromAccountId: fromAccountId,
        toAccountId: toAccountId,
        date: date,
      };

      const result =
        mode === "edit" && transfer
          ? await updateTransfer(transfer.id, data)
          : await createTransfer(data);

      if (result.success) {
        toast.success(
          mode === "edit"
            ? "Transfer updated successfully"
            : "Transfer created successfully"
        );
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${mode} transfer`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(`Failed to ${mode} transfer:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransfer = async () => {
    if (!transfer) return;
    const result = await deleteTransfer(transfer.id);
    if (result.success) {
      toast.success("Transfer deleted");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete transfer");
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={mode === "edit" ? "Edit Transfer" : "Add New Transfer"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Transfer Between Accounts</Label>
          <div className="flex flex-row items-center gap-3">
            <Select
              value={fromAccountId.toString()}
              onValueChange={(value) => setFromAccountId(parseInt(value))}
              required
            >
              <SelectTrigger
                className={cn(
                  "flex-1",
                  isSameAccount && "border-red-500 focus:border-red-500"
                )}
              >
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
            <Select
              value={toAccountId.toString()}
              onValueChange={(value) => setToAccountId(parseInt(value))}
              required
            >
              <SelectTrigger
                className={cn(
                  "flex-1",
                  isSameAccount && "border-red-500 focus:border-red-500"
                )}
              >
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isSameAccount && (
            <div className="text-sm text-red-500">
              From and To accounts must be different
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <CurrencyInput
            value={amount.toString()}
            onChange={(value) => setAmount(Number(value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Monthly savings transfer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <DatePicker
            date={date}
            onDateChange={(newDate) => setDate(newDate || new Date())}
            placeholder="Select date"
          />
        </div>

        <div className="flex justify-between">
          {mode === "edit" && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleDeleteTransfer()}
              disabled={isSubmitting}
            >
              Delete Transfer
            </Button>
          )}
          <div className="flex justify-end space-x-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isSameAccount}>
              {isSubmitting
                ? mode === "edit"
                  ? "Updating..."
                  : "Adding..."
                : mode === "edit"
                ? "Update Transfer"
                : "Add Transfer"}
            </Button>
          </div>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
