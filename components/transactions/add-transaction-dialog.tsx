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
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { TransactionType } from "@prisma/client";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/currency-input";
import { createTransaction } from "../../app/transactions/actions";
import { useRouter } from "next/navigation";

interface Account {
  id: number;
  name: string;
}

interface AddTransactionDialogProps {
  accounts: Account[];
}

export function AddTransactionDialog({ accounts }: AddTransactionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TransactionType | "">("");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !type || !amount || !category || !accountId) return;

    setIsSubmitting(true);
    try {
      const result = await createTransaction({
        description,
        type: type as TransactionType,
        category,
        amount: parseFloat(amount),
        accountId: accountId as number,
      });

      if (result.success) {
        toast.success("Transaction created successfully");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create transaction");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Failed to create transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
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
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
