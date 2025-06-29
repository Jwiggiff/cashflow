"use client";

import { useState } from "react";
import { CSVTransaction } from "@/lib/csv-parser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Account } from "@prisma/client";

interface CSVPreviewProps {
  transactions: CSVTransaction[];
  fileName: string;
  accounts: Account[];
  onImport: (transactions: CSVTransaction[], accountId: number) => void;
  onCancel: () => void;
}

export function CSVPreview({
  transactions,
  fileName,
  accounts,
  onImport,
  onCancel,
}: CSVPreviewProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const handleImport = async () => {
    if (!selectedAccountId) return;
    
    setIsImporting(true);
    try {
      await onImport(transactions, parseInt(selectedAccountId));
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">Import Preview</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {fileName} • {transactions.length} transactions
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">Select Account</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
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

          {/* Transactions Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-96 pr-2 overflow-auto">
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
                          className={`text-right font-medium ${
                            amount >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {amount >= 0
                            ? formatCurrency(amount)
                            : `-${formatCurrency(Math.abs(amount))}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel} disabled={isImporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={isImporting || !selectedAccountId}
            >
              {isImporting
                ? "Importing..."
                : `Import ${transactions.length} Transactions`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
