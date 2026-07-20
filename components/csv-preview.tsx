"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CSVTransaction } from "@/lib/csv-parser";
import { formatCurrency } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { BankAccount } from "@prisma/client";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";

interface CSVPreviewProps {
  transactions: CSVTransaction[];
  fileName: string;
  accounts: BankAccount[];
  onImport: (
    transactions: CSVTransaction[],
    accountId: number,
    autoCategorize: boolean
  ) => void;
  onCancel: () => void;
  canAutoCategorize: boolean;
}

export function CSVPreview({
  transactions,
  fileName,
  accounts,
  onImport,
  onCancel,
  canAutoCategorize,
}: CSVPreviewProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [autoCategorize, setAutoCategorize] = useState(canAutoCategorize);

  const handleImport = async () => {
    if (!selectedAccountId) return;

    setIsImporting(true);
    try {
      await onImport(transactions, parseInt(selectedAccountId), autoCategorize);
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-4">
      <Card className="flex h-[min(90vh,100%)] w-full max-w-6xl flex-col rounded-t-xl border-x-0 border-b-0 sm:h-auto sm:max-h-[90vh] sm:rounded-xl sm:border">
        <CardHeader className="flex shrink-0 flex-row items-start justify-between space-y-0 pb-4">
          <div className="min-w-0 pr-2">
            <CardTitle className="text-xl">Import Preview</CardTitle>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {fileName} · {transactions.length} transactions
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            aria-label="Close import preview"
          >
            <X className="size-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="shrink-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account">Select Account</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger id="account" className="w-full">
                  <SelectValue placeholder="Choose an account to import to" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} ({account.type.toLowerCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-categorize"
                checked={autoCategorize}
                disabled={!canAutoCategorize}
                onCheckedChange={(checked) =>
                  setAutoCategorize(checked as boolean)
                }
              />
              <Label htmlFor="auto-categorize" className="text-sm">
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4" />
                  Enable AI auto-categorization for expenses
                </span>
              </Label>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
            <ul className="max-h-full divide-y overflow-auto sm:hidden">
              {transactions.map((transaction, index) => {
                const amount = transaction.income - transaction.expense;
                return (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {transaction.merchant}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        amount > 0 &&
                          "text-emerald-700 dark:text-emerald-400",
                        amount < 0 && "text-destructive"
                      )}
                    >
                      {amount > 0 ? "+" : amount < 0 ? "−" : ""}
                      {formatCurrency(Math.abs(amount))}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="hidden max-h-96 overflow-auto sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => {
                    const amount = transaction.income - transaction.expense;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.merchant}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium tabular-nums",
                            amount > 0 &&
                              "text-emerald-700 dark:text-emerald-400",
                            amount < 0 && "text-destructive"
                          )}
                        >
                          {amount > 0 ? "+" : amount < 0 ? "−" : ""}
                          {formatCurrency(Math.abs(amount))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <Button variant="outline" onClick={onCancel} disabled={isImporting}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || !selectedAccountId}
            >
              {isImporting
                ? "Importing..."
                : `Import ${transactions.length}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
