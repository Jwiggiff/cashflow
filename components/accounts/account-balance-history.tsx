"use client";

import { BalanceHistoryChart } from "@/components/balance-history-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BalanceHistoryPoint } from "@/lib/types";
import { useMemo, useState } from "react";

type HistoryRange = "1M" | "3M" | "1Y" | "ALL";

const ranges: { label: string; value: HistoryRange; months: number | null }[] = [
  { label: "1M", value: "1M", months: 1 },
  { label: "3M", value: "3M", months: 3 },
  { label: "1Y", value: "1Y", months: 12 },
  { label: "All", value: "ALL", months: null },
];

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function subtractMonths(date: Date, months: number) {
  const targetMonth = date.getMonth() - months;
  const lastDay = new Date(
    date.getFullYear(),
    targetMonth + 1,
    0
  ).getDate();

  return new Date(
    date.getFullYear(),
    targetMonth,
    Math.min(date.getDate(), lastDay)
  );
}

function filterHistory(
  data: BalanceHistoryPoint[],
  months: number | null
) {
  if (months === null || data.length === 0) {
    return data;
  }

  const endDate = parseDateKey(data[data.length - 1].date);
  const cutoffDate = subtractMonths(endDate, months);
  const cutoffKey = toDateKey(cutoffDate);
  const visiblePoints = data.filter((point) => point.date >= cutoffKey);
  const openingPoint = [...data]
    .reverse()
    .find((point) => point.date < cutoffKey);

  return openingPoint
    ? [{ ...openingPoint, date: cutoffKey }, ...visiblePoints]
    : visiblePoints;
}

export function AccountBalanceHistory({
  data,
}: {
  data: BalanceHistoryPoint[];
}) {
  const [range, setRange] = useState<HistoryRange>("1Y");
  const selectedRange = ranges.find((item) => item.value === range);
  const filteredData = useMemo(
    () => filterHistory(data, selectedRange?.months ?? null),
    [data, selectedRange?.months]
  );

  return (
    <Card className="-mx-4 gap-4 rounded-none border-x-0 py-4 shadow-none @3xl:mx-0 @3xl:gap-6 @3xl:rounded-xl @3xl:border @3xl:py-6 @3xl:shadow-sm">
      <CardHeader className="px-4 @3xl:px-6">
        <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-start @3xl:justify-between">
          <div>
            <CardTitle>Balance History</CardTitle>
            <CardDescription className="mt-1 hidden @3xl:block">
              Closing balance after account activity and manual updates
            </CardDescription>
          </div>
          <div
            className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1 @3xl:flex @3xl:bg-transparent @3xl:p-0"
            aria-label="Balance history range"
          >
            {ranges.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={range === item.value ? "default" : "ghost"}
                onClick={() => setRange(item.value)}
                aria-pressed={range === item.value}
                className="w-full @3xl:w-auto"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 @3xl:px-2">
        <BalanceHistoryChart
          data={filteredData}
          className="h-[230px] w-full @3xl:h-[340px]"
        />
      </CardContent>
    </Card>
  );
}
