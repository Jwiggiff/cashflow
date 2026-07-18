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
import { ArrowDownLeft, ArrowRight, ArrowUpRight } from "lucide-react";
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
    <Card className="-mx-4 gap-0 rounded-none border-x-0 py-0 shadow-none md:mx-0 md:gap-6 md:rounded-xl md:border md:py-6 md:shadow-sm">
      <CardHeader className="px-4 py-4 md:px-6 md:py-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription className="mt-1 hidden md:block">
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
          <>
            <div className="divide-y border-t md:hidden">
              {items.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted",
                        item.amount > 0 && "text-green-600",
                        item.amount < 0 && "text-red-600"
                      )}
                    >
                      {item.amount >= 0 ? (
                        <ArrowDownLeft className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {item.description}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.detail} · {item.date}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "shrink-0 text-right text-sm font-semibold tabular-nums",
                        item.amount > 0 && "text-green-600",
                        item.amount < 0 && "text-red-600"
                      )}
                    >
                      {item.amount > 0 ? "+" : item.amount < 0 ? "−" : ""}
                      {formatCurrency(Math.abs(item.amount))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Details</TableHead>
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
                          <div className="font-medium">{item.description}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.detail}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "pr-6 text-right font-medium tabular-nums",
                            item.amount > 0 && "text-green-600",
                            item.amount < 0 && "text-red-600"
                          )}
                        >
                          {item.amount > 0
                            ? "+"
                            : item.amount < 0
                              ? "−"
                              : ""}
                          {formatCurrency(Math.abs(item.amount))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
