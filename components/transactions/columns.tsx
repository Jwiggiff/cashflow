import { formatDate } from "@/lib/formatter";
import {
  TransactionOrTransfer,
  TransactionWithAccountAndCategory,
  TransferWithAccounts,
} from "@/lib/types";
import { capitalize, cn } from "@/lib/utils";
import { BankAccount, Category } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic";
import React from "react";
import { TransactionActionsCell } from "./transaction-actions-cell";
import { TransferActionsCell } from "./transfer-actions-cell";

export function getColumns(
  accounts: BankAccount[],
  categories: Category[]
): ColumnDef<TransactionOrTransfer>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("id")}</div>
      ),
      enableHiding: true,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("date") as Date;
        return <div>{formatDate(date, { dateStyle: "short" })}</div>;
      },
      enableHiding: false,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("description")}</div>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const item = row.original;
        if ("source" in item && item.source) {
          // Check if it's a URL
          const isUrl =
            item.source.startsWith("http://") ||
            item.source.startsWith("https://") ||
            item.source.startsWith("mailto:");

          if (isUrl) {
            return (
              <a
                href={item.source}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate max-w-[200px] flex items-center gap-1"
              >
                <span className="truncate">{item.source}</span>
                <ExternalLinkIcon className="h-3 w-3 flex-shrink-0" />
              </a>
            );
          }

          return (
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
              {item.source}
            </div>
          );
        }
        return <div>-</div>;
      },
      enableHiding: true,
    },
    {
      accessorKey: "account",
      header: "Account",
      filterFn: (row, id, value) => {
        const item = row.original;
        if ("account" in item && item.account) {
          return String(item.account.id) === String(value);
        } else if (
          "fromAccount" in item &&
          item.fromAccount &&
          "toAccount" in item &&
          item.toAccount
        ) {
          return (
            String(item.fromAccount.id) === String(value) ||
            String(item.toAccount.id) === String(value)
          );
        }
        return false;
      },
      cell: ({ row }) => {
        const item = row.original;

        // Check if it has 'account' property (transaction) or 'fromAccount' property (transfer)
        if ("account" in item && item.account) {
          return <div>{item.account.name}</div>;
        } else if (
          "fromAccount" in item &&
          item.fromAccount &&
          "toAccount" in item &&
          item.toAccount
        ) {
          return (
            <div className="flex items-center gap-1">
              <span>{item.fromAccount.name}</span>
              <ArrowRightIcon className="h-3 w-3 text-muted-foreground" />
              <span>{item.toAccount.name}</span>
            </div>
          );
        }
        return <div>-</div>;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const item = row.original;
        return <div className="capitalize">{capitalize(item.type)}</div>;
      },
      enableHiding: true,
    },
    {
      accessorKey: "category",
      header: "Category",
      filterFn: (row, id, value) => {
        const item = row.original;
        return (
          "category" in item && String(item.category?.id) === String(value)
        );
      },
      cell: ({ row }) => {
        const item = row.original;

        if ("category" in item && item.category) {
          return (
            <div className="flex items-center gap-2">
              {item.category.icon && (
                <DynamicIcon
                  name={item.category.icon as keyof typeof dynamicIconImports}
                  className="h-4 w-4"
                />
              )}
              {item.category.name}
            </div>
          );
        }
        return <div>-</div>;
      },
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        const item = row.original;

        const isTransfer = "fromAccount" in item && item.fromAccount;

        const amount = parseFloat(item.amount.toString());
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(Math.abs(amount));

        return (
          <div
            className={cn(
              "text-right font-medium",
              amount > 0 ? "text-green-600" : "text-red-600",
              isTransfer ? "text-muted-foreground" : ""
            )}
          >
            {!isTransfer && amount > 0 ? "+" : ""}
            {formatted}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
      enableHiding: true,
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => {
        const date = row.getValue("updatedAt") as Date;
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
      enableHiding: true,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;

        if ("account" in item && item.account) {
          return (
            <TransactionActionsCell
              transaction={item as TransactionWithAccountAndCategory}
              accounts={accounts}
              categories={categories}
            />
          );
        } else {
          return (
            <TransferActionsCell
              transfer={item as TransferWithAccounts}
              accounts={accounts}
            />
          );
        }
      },
    },
  ];
}
