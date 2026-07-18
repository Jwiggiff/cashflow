"use client";

import { AccountDialog } from "@/components/accounts/account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import type { BankAccountWithAliases } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

type AccountDetailHeaderProps = {
  account: BankAccountWithAliases;
  balanceActivityLabel: string;
  balanceChange: number;
  balanceChangeDescription: string;
};

function formatAccountType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function AccountDetailHeader({
  account,
  balanceActivityLabel,
  balanceChange,
  balanceChangeDescription,
}: AccountDetailHeaderProps) {
  const { formatCurrency, isPrivate } = useFormatters();

  return (
    <>
      <header
        className="sticky top-0 z-30 -mx-4 border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 @3xl:hidden"
        style={{
          paddingTop: "max(0.5rem, env(safe-area-inset-top))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <div className="flex h-9 items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="-ml-2"
            aria-label="Back to accounts"
          >
            <Link href="/accounts">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="truncate font-semibold">{account.name}</h1>
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] uppercase"
            >
              {formatAccountType(account.type)}
            </Badge>
          </div>
          <AccountDialog
            mode="edit"
            account={account}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit account"
                className="-mr-2"
              >
                <Pencil />
              </Button>
            }
          />
        </div>
        <div className="flex items-end justify-between gap-4 px-1 pb-1 pt-2">
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground">
              Current balance
            </div>
            <div className="truncate text-2xl font-bold tabular-nums">
              {formatCurrency(account.balance)}
            </div>
          </div>
          <div className="min-w-0 text-right">
            <div
              className={cn(
                "truncate text-sm font-semibold tabular-nums",
                !isPrivate &&
                  balanceChange > 0 &&
                  "text-emerald-700 dark:text-emerald-400",
                !isPrivate && balanceChange < 0 && "text-destructive"
              )}
            >
              {!isPrivate && balanceChange > 0 ? "+" : ""}
              {formatCurrency(balanceChange)}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {balanceChangeDescription}
            </div>
          </div>
        </div>
      </header>

      <div className="hidden gap-6 p-8 @3xl:flex @3xl:items-end @3xl:justify-between">
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

        <div className="flex flex-col items-end gap-4">
          <div className="text-right">
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
    </>
  );
}
