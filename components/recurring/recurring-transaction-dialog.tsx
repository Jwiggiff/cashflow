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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getOccurenceInMonth } from "@/lib/utils";
import {
  BankAccount,
  Category,
  RecurringTransaction,
  TransactionType,
} from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RRule, Weekday } from "rrule";
import { toast } from "sonner";
import { RecurrenceTypeSelectItems } from "./recurrence-type-select-items";

interface RecurringTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringTransaction?: RecurringTransaction & {
    account: BankAccount;
    category: Category | null;
  };
  accounts: BankAccount[];
  categories: Category[];
  onSuccess: () => void;
}

export function RecurringTransactionDialog({
  open,
  onOpenChange,
  recurringTransaction,
  accounts,
  categories,
  onSuccess,
}: RecurringTransactionDialogProps) {
  const isEditing = !!recurringTransaction;
  const router = useRouter();

  const [description, setDescription] = useState(
    recurringTransaction?.description || ""
  );
  const [amount, setAmount] = useState(
    recurringTransaction?.amount ? Math.abs(recurringTransaction.amount).toString() : "0.00"
  );
  const [type, setType] = useState<TransactionType>(
    recurringTransaction?.type || "EXPENSE"
  );
  const [categoryId, setCategoryId] = useState<string>(
    recurringTransaction?.categoryId?.toString() || ""
  );
  const [accountId, setAccountId] = useState<string>(
    recurringTransaction?.accountId?.toString() || ""
  );
  const [startDate, setStartDate] = useState<Date>(
    recurringTransaction?.startDate || new Date()
  );

  const [recurrenceType, setRecurrenceType] = useState(
    recurringTransaction?.rrule || ""
  );

  // Update recurrenceType when startDate changes to maintain the same pattern
  useEffect(() => {
    if (recurrenceType) {
      try {
        const options = RRule.parseString(recurrenceType);

        if (options.freq === RRule.WEEKLY) {
          // For weekly/biweekly, just update the byweekday to match the new date's weekday
          options.byweekday =
            startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
        } else if (options.freq === RRule.MONTHLY) {
          if (options.byweekday) {
            // For monthly by weekday (e.g., "third Wednesday"), update both byweekday and bysetpos
            const occurrence = getOccurenceInMonth(startDate);
            const weekday = new Weekday(
              startDate.getDay() === 0 ? 6 : startDate.getDay() - 1
            );
            options.byweekday = weekday.nth(occurrence);
          } else {
            // For monthly by day of month (e.g., "15th of every month"), update bymonthday
            options.bymonthday = startDate.getDate();
          }
        }

        // Create new rule with updated options
        setRecurrenceType(RRule.optionsToString(options));
      } catch (error) {
        // If there's an error parsing the rule, just keep the current value
        console.error("Error updating recurrence type:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate]);

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
  const categoryItems: ComboboxItem[] = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
    icon: cat.icon || undefined,
  })) satisfies ComboboxItem[];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !accountId) {
      return;
    }

    try {
      const rrule_opts = RRule.parseString(recurrenceType);
      const rrule = new RRule(rrule_opts);

      const nextDueDate =
        startDate !== recurringTransaction?.startDate
          ? startDate
          : recurringTransaction?.nextDueDate;

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
        onOpenChange(false);
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
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to delete recurring transaction");
      }
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      toast.error("Failed to delete recurring transaction");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Edit Recurring Transaction"
              : "Create Recurring Transaction"}
          </DialogTitle>
        </DialogHeader>

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
                    onSelect={(date) => date && setStartDate(date)}
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

          <div className="flex justify-between">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteTransaction}
              >
                Delete Transaction
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
