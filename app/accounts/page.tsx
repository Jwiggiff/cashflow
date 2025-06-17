"use client";

import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCardIcon, Building2Icon, PiggyBankIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const accounts = [
  {
    id: 1,
    name: "Main Checking",
    type: "Checking",
    balance: 12500.45,
    lastTransaction: "2024-03-15",
    icon: CreditCardIcon,
  },
  {
    id: 2,
    name: "Savings Account",
    type: "Savings",
    balance: 25000.0,
    lastTransaction: "2024-03-14",
    icon: PiggyBankIcon,
  },
  {
    id: 3,
    name: "Investment Account",
    type: "Investment",
    balance: 45000.75,
    lastTransaction: "2024-03-13",
    icon: Building2Icon,
  },
];

const recentTransactions = [
  {
    id: 1,
    account: "Main Checking",
    description: "Grocery Store",
    amount: -85.5,
    date: "2024-03-15",
    type: "expense",
  },
  {
    id: 2,
    account: "Main Checking",
    description: "Salary Deposit",
    amount: 3500.0,
    date: "2024-03-14",
    type: "income",
  },
  {
    id: 3,
    account: "Savings Account",
    description: "Monthly Transfer",
    amount: 500.0,
    date: "2024-03-14",
    type: "transfer",
  },
];

export default function AccountsPage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      <Separator />

      <div className="flex-1 p-8">
        {/* Accounts Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {account.name}
                </CardTitle>
                <account.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${account.balance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last transaction: {account.lastTransaction}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="ghost" asChild>
              <Link href="/transactions">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.account} • {transaction.date}
                    </p>
                  </div>
                  <div
                    className={`font-medium ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}$
                    {Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
