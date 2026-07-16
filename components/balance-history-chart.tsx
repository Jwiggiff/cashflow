"use client";

import { CurrencyTooltipFormatter } from "@/components/dashboard/currency-tooltip-formatter";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useFormatters } from "@/hooks/use-formatters";
import type { BalanceHistoryPoint } from "@/lib/types";
import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

type BalanceHistoryChartProps = {
  data: BalanceHistoryPoint[];
  className?: string;
};

function formatHistoryDate(value: string, includeYear = false) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(new Date(year, month - 1, day));
}

export function BalanceHistoryChart({
  data,
  className = "h-[240px] w-full",
}: BalanceHistoryChartProps) {
  const { formatCurrency } = useFormatters();
  const gradientId = `balance-fill-${useId().replace(/:/g, "")}`;

  if (data.length === 0) {
    return (
      <div
        className={`${className} flex items-center justify-center text-sm text-muted-foreground`}
      >
        Balance history will appear after the next balance change.
      </div>
    );
  }

  return (
    <ChartContainer
      config={{
        balance: {
          label: "Balance",
          color: "var(--chart-1)",
        },
      }}
      className={className}
    >
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ top: 8, right: 12, bottom: 0, left: 4 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-balance)"
              stopOpacity={0.7}
            />
            <stop
              offset="95%"
              stopColor="var(--color-balance)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(date) => formatHistoryDate(date)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={72}
          domain={["auto", "auto"]}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(date) =>
                formatHistoryDate(String(date), true)
              }
              formatter={(_, __, item) => (
                <CurrencyTooltipFormatter item={item} />
              )}
            />
          }
        />
        <Area
          dataKey="balance"
          type="monotone"
          fill={`url(#${gradientId})`}
          stroke="var(--color-balance)"
          strokeWidth={2}
          dot={data.length === 1}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
