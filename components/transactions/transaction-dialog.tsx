"use client";

import { createCategory } from "@/app/categories/actions";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/app/transactions/actions";
import { Combobox, ComboboxItem } from "@/components/combobox";
import { CurrencyInput } from "@/components/currency-input";
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
import { TransactionWithAccountAndCategory } from "@/lib/types";
import { Category, TransactionType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLinkIcon } from "lucide-react";

interface Account {
  id: number;
  name: string;
}

interface TransactionDialogProps {
  accounts: Account[];
  categories: Category[];
  mode?: "add" | "edit";
  transaction?: TransactionWithAccountAndCategory;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function TransactionDialog({
  accounts,
  categories,
  mode = "add",
  transaction,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: TransactionDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [amount, setAmount] = useState(transaction?.amount || 0);
  const [description, setDescription] = useState(
    transaction?.description || ""
  );
  const [source, setSource] = useState(transaction?.source || "");
  const [type, setType] = useState<TransactionType>(
    transaction?.type || TransactionType.EXPENSE
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    transaction?.categoryId || null
  );
  const [accountId, setAccountId] = useState<number | "">(
    transaction?.accountId || ""
  );
  const [date, setDate] = useState<Date>(transaction?.date || new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  const handleCreateCategory = async (name: string) => {
    const result = await createCategory({ name });
    if (result.success && result.data) {
      setCategoryId(result.data.id);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create category");
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transaction) return;
    const result = await deleteTransaction(transaction.id);
    if (result.success) {
      toast.success("Transaction deleted");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete transaction");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate required fields
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!amount || amount <= 0) {
      newErrors.amount = "Amount is required and must be greater than 0";
    }

    if (!accountId) {
      newErrors.accountId = "Account is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        description,
        source: source || null,
        type: type as TransactionType,
        categoryId: categoryId,
        amount: amount,
        accountId: accountId as number,
        date,
      };

      const result =
        mode === "edit" && transaction
          ? await updateTransaction(transaction.id, data)
          : await createTransaction(data);

      if (result.success) {
        toast.success(
          mode === "edit"
            ? "Transaction updated successfully"
            : "Transaction created successfully"
        );
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

  // Convert categories to combobox items
  const categoryItems: ComboboxItem[] = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
    icon: cat.icon || undefined,
  })) satisfies ComboboxItem[];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={mode === "edit" ? "Edit Transaction" : "Add New Transaction"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <CurrencyInput
            value={amount.toString()}
            onChange={(value) => setAmount(Number(value))}
            className={
              errors.amount ? "border-red-500 focus:border-red-500" : ""
            }
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Grocery Store"
              className={
                errors.description ? "border-red-500 focus:border-red-500" : ""
              }
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <div className="flex flex-row items-center gap-2">
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="URL, email, or reference"
                type="url"
              />
              {mode === "edit" && transaction?.source && (
                <a
                  href={transaction.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground"
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker
              date={date}
              onDateChange={(newDate) => setDate(newDate || new Date())}
              placeholder="Select date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select
              value={accountId.toString()}
              onValueChange={(value) => setAccountId(parseInt(value))}
            >
              <SelectTrigger
                className={`w-full ${
                  errors.accountId ? "border-red-500 focus:border-red-500" : ""
                }`}
              >
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
            {errors.accountId && (
              <p className="text-sm text-red-500">{errors.accountId}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as TransactionType)}
            >
              <SelectTrigger className="w-full">
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
          {type === TransactionType.EXPENSE && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Combobox
                items={categoryItems}
                value={categoryId?.toString() ?? ""}
                onChange={(value) =>
                  setCategoryId(value ? parseInt(value) : null)
                }
                placeholder="Select or create category..."
                searchPlaceholder="Search categories..."
                onCreateItem={handleCreateCategory}
                createLabel="Create category"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between">
          {mode === "edit" && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleDeleteTransaction()}
              disabled={isSubmitting}
            >
              Delete Transaction
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "edit"
                  ? "Updating..."
                  : "Adding..."
                : mode === "edit"
                ? "Update Transaction"
                : "Add Transaction"}
            </Button>
          </div>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
