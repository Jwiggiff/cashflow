"use client";

import { createCategory } from "@/app/categories/actions";
import {
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from "@/app/recurring/actions";
import { Combobox, ComboboxItem } from "@/components/combobox";
import { CurrencyInput } from "@/components/currency-input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { computeNextDueDateForCreate } from "@/lib/recurring-schedule";
import { alignRRuleToStartDate } from "@/lib/standard-recurrence-rrules";
import { cn } from "@/lib/utils";
import {
  BankAccount,
  Category,
  RecurringTransaction,
  TransactionType,
} from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { RRule } from "rrule";
import { toast } from "sonner";
import { RecurrenceTypeSelectItems } from "./recurrence-type-select-items";

export type RecurringTransactionPrefill = {
  description: string;
  amount: number;
  type: TransactionType;
  accountId: number;
  startDate: Date;
  rrule: string;
};

interface RecurringTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringTransaction?: RecurringTransaction & {
    account: BankAccount;
    category: Category | null;
  };
  /** When creating (no recurringTransaction), seed the form from a dashboard recommendation */
  prefillForCreate?: RecurringTransactionPrefill | null;
  accounts: BankAccount[];
  categories: Category[];
  onSuccess: () => void;
}

/** Prefill account from `?account=` (kept in sync by the transactions page filter). */
function resolveDefaultAccountId(
  accounts: BankAccount[],
  accountParam?: string | null
): string {
  const fromParam = accountParam ? Number(accountParam) : NaN;
  if (
    Number.isFinite(fromParam) &&
    accounts.some((account) => account.id === fromParam)
  ) {
    return fromParam.toString();
  }

  return "";
}

export function RecurringTransactionDialog({
  open,
  onOpenChange,
  recurringTransaction,
  prefillForCreate = null,
  accounts,
  categories,
  onSuccess,
}: RecurringTransactionDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        recurringTransaction
          ? "Edit Recurring Transaction"
          : "Create Recurring Transaction"
      }
      className="max-w-md"
    >
      <RecurringTransactionForm
        recurringTransaction={recurringTransaction}
        prefillForCreate={prefillForCreate}
        accounts={accounts}
        categories={categories}
        onSuccess={onSuccess}
        onClose={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
}

interface RecurringTransactionFormProps
  extends Omit<RecurringTransactionDialogProps, "open" | "onOpenChange"> {
  onClose: () => void;
}

// Mounted fresh each time the dialog opens, so initial state comes from props.
function RecurringTransactionForm({
  recurringTransaction,
  prefillForCreate = null,
  accounts,
  categories,
  onSuccess,
  onClose,
}: RecurringTransactionFormProps) {
  const isEditing = !!recurringTransaction;
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = recurringTransaction ? null : prefillForCreate;

  const [description, setDescription] = useState(
    recurringTransaction?.description ?? prefill?.description ?? ""
  );
  const [amount, setAmount] = useState(
    recurringTransaction
      ? recurringTransaction.amount
        ? Math.abs(recurringTransaction.amount).toString()
        : "0.00"
      : prefill
        ? Math.abs(prefill.amount).toFixed(2)
        : "0.00"
  );
  const [type, setType] = useState<TransactionType>(
    recurringTransaction?.type ?? prefill?.type ?? TransactionType.EXPENSE
  );
  const [categoryId, setCategoryId] = useState<string>(
    recurringTransaction?.categoryId?.toString() || ""
  );
  const [accountId, setAccountId] = useState<string>(() =>
    recurringTransaction
      ? recurringTransaction.accountId?.toString() || ""
      : prefill
        ? prefill.accountId.toString()
        : resolveDefaultAccountId(accounts, searchParams.get("account"))
  );
  const [startDate, setStartDate] = useState<Date>(
    recurringTransaction?.startDate ?? prefill?.startDate ?? new Date()
  );

  const [recurrenceType, setRecurrenceType] = useState(() =>
    alignRRuleToStartDate(
      recurringTransaction?.rrule ?? prefill?.rrule ?? "",
      startDate
    )
  );

  // Keep the selected recurrence pattern anchored to the new start date
  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    setRecurrenceType((rule) => alignRRuleToStartDate(rule, date));
  };

  const handleCreateCategory = async (name: string) => {
    const result = await createCategory({ name });
    if (result.success && result.data) {
      setCategoryId(result.data.id.toString());
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create category");
    }
  };

  // Convert categories to combobox items
  const categoryItems: ComboboxItem[] = [
    { value: "", label: "No category" },
    ...categories.map((cat) => ({
      value: cat.id.toString(),
      label: cat.name,
      icon: cat.icon || undefined,
    })),
  ] satisfies ComboboxItem[];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !accountId) {
      return;
    }

    try {
      const rrule_opts = RRule.parseString(recurrenceType);
      const rrule = new RRule(rrule_opts);

      const nextDueDate = isEditing
        ? startDate !== recurringTransaction?.startDate
          ? startDate
          : recurringTransaction?.nextDueDate
        : computeNextDueDateForCreate(rrule, startDate);

      const data = {
        description,
        amount: Number(amount),
        type,
        categoryId: categoryId ? parseInt(categoryId) : null,
        accountId: parseInt(accountId),
        rrule: rrule.toString(),
        startDate,
        nextDueDate,
      };

      const result = isEditing
        ? await updateRecurringTransaction(recurringTransaction.id, data)
        : await createRecurringTransaction(data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Recurring transaction updated successfully"
            : "Recurring transaction created successfully"
        );
        onClose();
        onSuccess();
      } else {
        toast.error(result.error || "Failed to save recurring transaction");
      }
    } catch (error) {
      console.error("Error saving recurring transaction:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteTransaction = async () => {
    if (!recurringTransaction) return;

    try {
      const result = await deleteRecurringTransaction(recurringTransaction.id);
      if (result.success) {
        toast.success("Recurring transaction deleted");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to delete recurring transaction");
      }
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      toast.error("Failed to delete recurring transaction");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Rent payment"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <CurrencyInput
              value={amount}
              onChange={(value) => setAmount(value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && handleStartDateChange(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an account" />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={type}
              onValueChange={(value: TransactionType) => setType(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "EXPENSE" && (
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Combobox
                items={categoryItems}
                value={categoryId}
                onChange={(value) => setCategoryId(value || "")}
                placeholder="Select or create category..."
                searchPlaceholder="Search categories..."
                onCreateItem={handleCreateCategory}
                createLabel="Create category"
              />
            </div>
          )}
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label>Repeats</Label>
            <Select
              value={recurrenceType}
              onValueChange={(value: string) => setRecurrenceType(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <RecurrenceTypeSelectItems startDate={startDate} />
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteTransaction}
            >
              Delete
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
          </div>
        </div>
      </form>
  );
}
