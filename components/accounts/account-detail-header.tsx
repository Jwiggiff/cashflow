"use client";

import { AccountDialog } from "@/components/accounts/account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import type { BankAccountWithAliases } from "@/lib/types";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

type AccountDetailHeaderProps = {
  account: BankAccountWithAliases;
  balanceActivityLabel: string;
};

function formatAccountType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function AccountDetailHeader({
  account,
  balanceActivityLabel,
}: AccountDetailHeaderProps) {
  const { formatCurrency } = useFormatters();

  return (
    <div className="flex flex-col gap-6 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-8">
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
          {balanceActivityLabel}
        </p>
      </div>

      <div className="flex flex-col items-start gap-4 sm:items-end">
        <div className="sm:text-right">
          <div className="text-sm text-muted-foreground">Current balance</div>
          <div className="text-2xl font-bold tabular-nums sm:text-3xl">
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
