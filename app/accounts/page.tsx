import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreditCardIcon,
  PiggyBankIcon,
  CircleQuestionMarkIcon,
  ChartNoAxesCombinedIcon,
  HandCoinsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AddAccountDialog } from "./add-account-dialog";
import prisma from "@/lib/prisma";
import { EmptyState } from "./empty-state";

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

const getAccountIcon = (type: string) => {
  switch (type) {
    case "CHECKING":
      return HandCoinsIcon;
    case "SAVINGS":
      return PiggyBankIcon;
    case "INVESTMENT":
      return ChartNoAxesCombinedIcon;
    case "CREDIT":
      return CreditCardIcon;
    default:
      return CircleQuestionMarkIcon;
  }
};

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  if (accounts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <AddAccountDialog />
      </div>

      <Separator />

      <div className="flex-1 p-8">
        {/* Accounts Overview */}
        <div className="flex flex-wrap gap-4 mb-8">
          {accounts.map((account) => {
            const Icon = getAccountIcon(account.type);
            return (
              <Card key={account.id} className="flex-1 min-w-3xs">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {account.name}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${account.balance.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last transaction: {account.updatedAt.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
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
