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
import { useState, useEffect } from "react";
import { TransactionType } from "@prisma/client";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/currency-input";
import { createTransaction, updateTransaction } from "@/app/transactions/actions";
import { useRouter } from "next/navigation";
import { TransactionWithAccount } from "@/lib/types";

interface Account {
  id: number;
  name: string;
}

interface TransactionDialogProps {
  accounts: Account[];
  mode?: "add" | "edit";
  transaction?: TransactionWithAccount;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function TransactionDialog({ 
  accounts, 
  mode = "add", 
  transaction, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  trigger,
}: TransactionDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TransactionType | "">("");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  // Initialize form with transaction data when editing
  useEffect(() => {
    if (mode === "edit" && transaction) {
      setDescription(transaction.description);
      setType(transaction.type);
      setCategory(transaction.category);
      setAmount(Math.abs(transaction.amount).toFixed(2));
      setAccountId(transaction.accountId);
    } else {
      // Reset form for add mode
      setDescription("");
      setType("");
      setCategory("");
      setAmount("");
      setAccountId("");
    }
  }, [mode, transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !type || !amount || !category || !accountId) return;

    setIsSubmitting(true);
    try {
      const data = {
        description,
        type: type as TransactionType,
        category,
        amount: parseFloat(amount),
        accountId: accountId as number,
      };

      const result = mode === "edit" && transaction
        ? await updateTransaction(transaction.id, data)
        : await createTransaction(data);

      if (result.success) {
        toast.success(mode === "edit" ? "Transaction updated successfully" : "Transaction created successfully");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${mode} transaction`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(`Failed to ${mode} transaction:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Grocery Store"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select
              value={accountId.toString()}
              onValueChange={(value) => setAccountId(parseInt(value))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
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
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as TransactionType)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(TransactionType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Food & Dining"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <CurrencyInput value={amount} onChange={setAmount} />
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === "edit" ? "Updating..." : "Adding...") : (mode === "edit" ? "Update Transaction" : "Add Transaction")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
