"use client";

import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

// Sample data - in a real app, this would come from an API
const transactions = [
  {
    id: 1,
    date: "2024-03-15",
    description: "Grocery Store",
    account: "Main Checking",
    category: "Food & Dining",
    amount: -85.5,
    type: "expense",
  },
  {
    id: 2,
    date: "2024-03-14",
    description: "Salary Deposit",
    account: "Main Checking",
    category: "Income",
    amount: 3500.0,
    type: "income",
  },
  {
    id: 3,
    date: "2024-03-14",
    description: "Monthly Transfer",
    account: "Savings Account",
    category: "Transfer",
    amount: 500.0,
    type: "transfer",
  },
  {
    id: 4,
    date: "2024-03-13",
    description: "Electric Bill",
    account: "Main Checking",
    category: "Utilities",
    amount: -120.0,
    type: "expense",
  },
  {
    id: 5,
    date: "2024-03-12",
    description: "Restaurant",
    account: "Main Checking",
    category: "Food & Dining",
    amount: -65.0,
    type: "expense",
  },
];

export default function TransactionsPage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Button>Add Transaction</Button>
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell className="font-medium">
                    {transaction.description}
                  </TableCell>
                  <TableCell>{transaction.account}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}$
                    {Math.abs(transaction.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 