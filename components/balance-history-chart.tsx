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

function historyDateToTimestamp(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function formatHistoryTimestamp(value: number, includeYear = false) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(new Date(value));
}

export function BalanceHistoryChart({
  data,
  className = "h-[240px] w-full",
}: BalanceHistoryChartProps) {
  const { formatCurrency } = useFormatters();
  const gradientId = `balance-fill-${useId().replace(/:/g, "")}`;
  const chartData = data.map((point) => ({
    ...point,
    timestamp: historyDateToTimestamp(point.date),
  }));

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
        data={chartData}
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
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(timestamp) => formatHistoryTimestamp(timestamp)}
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
              labelFormatter={(_, payload) => {
                const timestamp = payload[0]?.payload?.timestamp;
                return timestamp
                  ? formatHistoryTimestamp(Number(timestamp), true)
                  : "";
              }}
              formatter={(_, __, item) => (
                <CurrencyTooltipFormatter item={item} />
              )}
            />
          }
        />
        <Area
          dataKey="balance"
          type="stepAfter"
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
