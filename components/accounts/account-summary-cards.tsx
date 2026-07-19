"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { useFormatters } from "@/hooks/use-formatters";
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";

type AccountSummaryCardsProps = {
  inflow: number;
  outflow: number;
  balanceChange: number;
  balanceChangeDescription: string;
};

export function AccountSummaryCards({
  inflow,
  outflow,
  balanceChange,
  balanceChangeDescription,
}: AccountSummaryCardsProps) {
  const { formatCurrency } = useFormatters();

  return (
    <>
      <Card className="gap-0 py-0 @3xl:hidden">
        <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">
          This month · includes transfers
        </div>
        <div className="grid grid-cols-2">
          <div className="min-w-0 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDownToLine className="size-3.5" />
              Inflow
            </div>
            <div className="truncate text-sm font-semibold tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatCurrency(inflow)}
            </div>
          </div>
          <div className="min-w-0 border-l p-4 text-right">
            <div className="mb-1 flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
              Outflow
              <ArrowUpFromLine className="size-3.5" />
            </div>
            <div className="truncate text-sm font-semibold tracking-tight tabular-nums text-destructive">
              {formatCurrency(outflow)}
            </div>
          </div>
        </div>
      </Card>

      <div className="hidden gap-4 @3xl:grid @3xl:grid-cols-3">
        <StatCard
          title="Inflow"
          value={formatCurrency(inflow)}
          change="This month, including transfers"
          icon={ArrowDownToLine}
        />
        <StatCard
          title="Outflow"
          value={formatCurrency(outflow)}
          change="This month, including transfers"
          icon={ArrowUpFromLine}
        />
        <StatCard
          title="Balance Change"
          value={formatCurrency(balanceChange)}
          change={balanceChangeDescription}
          icon={TrendingUp}
        />
      </div>
    </>
  );
}
