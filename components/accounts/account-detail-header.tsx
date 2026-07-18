"use client";

import { AccountDialog } from "@/components/accounts/account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { formatDate } from "@/lib/formatter";
import type { BankAccountWithAliases } from "@/lib/types";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

type AccountDetailHeaderProps = {
  account: BankAccountWithAliases;
  lastBalanceChangeAt: Date | null;
  trackingStartedAt: Date;
};

function formatAccountType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function AccountDetailHeader({
  account,
  lastBalanceChangeAt,
  trackingStartedAt,
}: AccountDetailHeaderProps) {
  const { formatCurrency } = useFormatters();
  const activityDate = lastBalanceChangeAt ?? trackingStartedAt;

  return (
    <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/accounts">
            <ArrowLeft />
            Accounts
          </Link>
        </Button>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="truncate text-3xl font-bold">{account.name}</h1>
          <Badge variant="secondary">{formatAccountType(account.type)}</Badge>
        </div>
        {account.aliases.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Aliases: {account.aliases.map((alias) => alias.name).join(", ")}
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {lastBalanceChangeAt
            ? "Last balance change"
            : "Balance tracking started"}{" "}
          {formatDate(activityDate, { dateStyle: "medium" })}
        </p>
      </div>

      <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
        <div className="sm:text-right">
          <div className="text-sm text-muted-foreground">Current balance</div>
          <div className="text-3xl font-bold tabular-nums">
            {formatCurrency(account.balance)}
          </div>
        </div>
        <AccountDialog
          mode="edit"
          account={account}
          trigger={
            <Button variant="outline">
              <Pencil />
              Edit account
            </Button>
          }
        />
      </div>
    </div>
  );
}
