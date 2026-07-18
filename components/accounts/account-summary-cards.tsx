"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { useFormatters } from "@/hooks/use-formatters";
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";

type AccountSummaryCardsProps = {
  inflow: number;
  outflow: number;
  balanceChange: number;
};

export function AccountSummaryCards({
  inflow,
  outflow,
  balanceChange,
}: AccountSummaryCardsProps) {
  const { formatCurrency } = useFormatters();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
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
        change="Since the start of this month"
        icon={TrendingUp}
      />
    </div>
  );
}
