"use client";

import { assignTransactionAccount } from "@/app/transactions/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormatters } from "@/hooks/use-formatters";
import { BankAccount } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface NeedsAccountFormProps {
  transaction: {
    id: number;
    description: string;
    amount: number;
    date: Date;
    type: string;
  };
  accounts: BankAccount[];
  remainingCount: number;
}

export function NeedsAccountForm({
  transaction,
  accounts,
  remainingCount,
}: NeedsAccountFormProps) {
  const { formatCurrency } = useFormatters();
  const router = useRouter();
  const [accountId, setAccountId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!accountId) {
      toast.error("Pick an account first");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await assignTransactionAccount(transaction.id, accountId);
      if (result.success) {
        toast.success("Account assigned");
        router.push("/transactions/needs-account");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to assign account");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 py-8">
      {remainingCount > 1 && (
        <p className="text-sm text-muted-foreground">
          {remainingCount} transactions need an account - 1 of {remainingCount}
        </p>
      )}
      <div className="space-y-1 rounded-lg border bg-muted/40 p-4">
        <div className="text-lg font-semibold">
          {transaction.description}
        </div>
        <div
          className={
            transaction.type === "EXPENSE"
              ? "text-destructive"
              : "text-emerald-700 dark:text-emerald-400"
          }
        >
          {formatCurrency(Math.abs(transaction.amount))}
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date(transaction.date).toLocaleDateString()}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account">Which account is this for?</Label>
        <Select
          value={accountId.toString()}
          onValueChange={(value) => setAccountId(parseInt(value))}
        >
          <SelectTrigger className="w-full" id="account">
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

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={isSubmitting || !accountId}
      >
        {isSubmitting ? "Saving..." : "Assign Account"}
      </Button>
    </div>
  );
}
