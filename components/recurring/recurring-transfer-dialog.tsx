"use client";

import {
  createRecurringTransfer,
  updateRecurringTransfer,
  deleteRecurringTransfer,
} from "@/app/recurring/actions";
import { CurrencyInput } from "@/components/currency-input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { cn, getOccurenceInMonth } from "@/lib/utils";
import { BankAccount, RecurringTransfer } from "@prisma/client";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RRule, Weekday } from "rrule";
import { toast } from "sonner";
import { RecurrenceTypeSelectItems } from "./recurrence-type-select-items";

interface RecurringTransferWithAccounts extends RecurringTransfer {
  fromAccount: BankAccount;
  toAccount: BankAccount;
}

interface RecurringTransferDialogProps {
  accounts: BankAccount[];
  mode?: "add" | "edit";
  recurringTransfer?: RecurringTransferWithAccounts;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function RecurringTransferDialog({
  accounts,
  mode = "add",
  recurringTransfer,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSuccess,
}: RecurringTransferDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [amount, setAmount] = useState(
    recurringTransfer?.amount.toString() || "0.00"
  );
  const [description, setDescription] = useState(
    recurringTransfer?.description || ""
  );
  const [fromAccountId, setFromAccountId] = useState<number | "">(
    recurringTransfer?.fromAccountId || ""
  );
  const [toAccountId, setToAccountId] = useState<number | "">(
    recurringTransfer?.toAccountId || ""
  );
  const [startDate, setStartDate] = useState<Date>(
    recurringTransfer?.startDate || new Date()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState(
    recurringTransfer?.rrule || ""
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

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  // Check if accounts are the same for validation
  const isSameAccount =
    fromAccountId !== "" && toAccountId !== "" && fromAccountId === toAccountId;

  // Reset the form state when dialog opens
  useEffect(() => {
    if (open) {
      setAmount(recurringTransfer?.amount.toString() || "0.00");
      setDescription(recurringTransfer?.description || "");
      setFromAccountId(recurringTransfer?.fromAccountId || "");
      setToAccountId(recurringTransfer?.toAccountId || "");
      setStartDate(recurringTransfer?.startDate || new Date());
      setRecurrenceType(recurringTransfer?.rrule || "");
    }
  }, [recurringTransfer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !fromAccountId || !toAccountId) return;

    if (isSameAccount) {
      toast.error("From and To accounts must be different");
      return;
    }

    setIsSubmitting(true);
    try {
      const rrule_opts = RRule.parseString(recurrenceType);
      const rrule = new RRule(rrule_opts);

      const nextDueDate =
        startDate !== recurringTransfer?.startDate
          ? startDate
          : recurringTransfer?.nextDueDate;

      const data = {
        description: description || undefined,
        amount: Number(amount),
        fromAccountId: fromAccountId as number,
        toAccountId: toAccountId as number,
        rrule: rrule.toString(),
        startDate: startDate,
        nextDueDate,
      };

      const result =
        mode === "edit" && recurringTransfer
          ? await updateRecurringTransfer(recurringTransfer.id, data)
          : await createRecurringTransfer(data);

      if (result.success) {
        toast.success(
          mode === "edit"
            ? "Recurring transfer updated successfully"
            : "Recurring transfer created successfully"
        );
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error || `Failed to ${mode} recurring transfer`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(`Failed to ${mode} recurring transfer:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransfer = async () => {
    if (!recurringTransfer) return;

    try {
      const result = await deleteRecurringTransfer(recurringTransfer.id);
      if (result.success) {
        toast.success("Recurring transfer deleted");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error || "Failed to delete recurring transfer");
      }
    } catch (error) {
      console.error("Error deleting recurring transfer:", error);
      toast.error("Failed to delete recurring transfer");
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={
        mode === "edit" ? "Edit Recurring Transfer" : "Add Recurring Transfer"
      }
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
            value={amount}
            onChange={(value) => setAmount(value)}
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
          <Label htmlFor="date">Start Date</Label>
          <DatePicker
            date={startDate}
            onDateChange={(newDate) => setStartDate(newDate || new Date())}
            placeholder="Select start date"
          />
        </div>
        <div className="space-y-2">
          <Label>Repeats</Label>
          <Select
            value={recurrenceType}
            onValueChange={(value) => setRecurrenceType(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <RecurrenceTypeSelectItems startDate={startDate} />
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between">
          {mode === "edit" && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteTransfer}
              disabled={isSubmitting}
            >
              Delete Transfer
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
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
                ? "Update Recurring Transfer"
                : "Add Recurring Transfer"}
            </Button>
          </div>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
