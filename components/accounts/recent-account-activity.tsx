"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFormatters } from "@/hooks/use-formatters";
import { formatDate } from "@/lib/formatter";
import type { TransactionOrTransfer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type RecentAccountActivityProps = {
  accountId: number;
  items: TransactionOrTransfer[];
};

function getActivityDetails(item: TransactionOrTransfer, accountId: number) {
  if (item.type === "TRANSFER") {
    const isOutgoing = item.fromAccountId === accountId;
    return {
      description: item.description || "Transfer",
      detail: isOutgoing
        ? `To ${item.toAccount.name}`
        : `From ${item.fromAccount.name}`,
      amount: isOutgoing ? -item.amount : item.amount,
    };
  }

  return {
    description: item.description,
    detail: item.category?.name ?? "Uncategorized",
    amount: item.amount,
  };
}

export function RecentAccountActivity({
  accountId,
  items,
}: RecentAccountActivityProps) {
  const { formatCurrency } = useFormatters();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription className="mt-1">
              Latest transactions and transfers for this account
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/transactions?account=${accountId}`}>
              View all
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {items.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No activity recorded for this account yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden sm:table-cell">Details</TableHead>
                <TableHead className="pr-6 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const activity = getActivityDetails(item, accountId);

                return (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell className="pl-6 text-muted-foreground">
                      {formatDate(item.date, { dateStyle: "short" })}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[180px] truncate font-medium sm:max-w-none">
                        {activity.description}
                      </div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {activity.detail}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {activity.detail}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "pr-6 text-right font-medium tabular-nums",
                        activity.amount > 0 && "text-green-600",
                        activity.amount < 0 && "text-red-600"
                      )}
                    >
                      {activity.amount > 0 ? "+" : activity.amount < 0 ? "−" : ""}
                      {formatCurrency(Math.abs(activity.amount))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
