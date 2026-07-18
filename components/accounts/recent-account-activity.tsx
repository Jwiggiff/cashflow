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
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export type RecentAccountActivityItem = {
  id: string;
  date: string;
  description: string;
  detail: string;
  amount: number;
};

export function RecentAccountActivity({
  accountId,
  items,
}: {
  accountId: number;
  items: RecentAccountActivityItem[];
}) {
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
                return (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6 text-muted-foreground">
                      {item.date}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[180px] truncate font-medium sm:max-w-none">
                        {item.description}
                      </div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {item.detail}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {item.detail}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "pr-6 text-right font-medium tabular-nums",
                        item.amount > 0 && "text-green-600",
                        item.amount < 0 && "text-red-600"
                      )}
                    >
                      {item.amount > 0 ? "+" : item.amount < 0 ? "−" : ""}
                      {formatCurrency(Math.abs(item.amount))}
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
