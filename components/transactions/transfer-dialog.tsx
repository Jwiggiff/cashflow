"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/currency-input";
import { createTransfer, updateTransfer } from "@/app/transactions/actions";
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
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [toAccountId, setToAccountId] = useState<number | "">("");
  const [date, setDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  // Check if accounts are the same for validation
  const isSameAccount =
    fromAccountId !== "" && toAccountId !== "" && fromAccountId === toAccountId;

  // Initialize form with transfer data when editing
  useEffect(() => {
    if (mode === "edit" && transfer) {
      setDescription(transfer.description || "");
      setAmount(transfer.amount.toFixed(2));
      setFromAccountId(transfer.fromAccountId);
      setToAccountId(transfer.toAccountId);
      setDate(new Date(transfer.date));
    } else {
      // Reset form for add mode
      setDescription("");
      setAmount("");
      setFromAccountId("");
      setToAccountId("");
      setDate(new Date());
    }
  }, [mode, transfer, open]);

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
        amount: parseFloat(amount),
        fromAccountId: fromAccountId as number,
        toAccountId: toAccountId as number,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Transfer" : "Add New Transfer"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Transfer Between Accounts</Label>
            <div className="flex items-center gap-3">
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
            <CurrencyInput value={amount} onChange={setAmount} />
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
          <div className="flex justify-end space-x-2">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
