import { ColumnDef } from "@tanstack/react-table";
import { TransactionActionsCell } from "./transaction-actions-cell";
import {
  TransactionOrTransfer,
  TransactionWithAccountAndCategory,
  TransferWithAccounts,
} from "@/lib/types";
import { ArrowRightIcon } from "lucide-react";
import { capitalize, cn } from "@/lib/utils";
import { TransferActionsCell } from "./transfer-actions-cell";
import { Category } from "@prisma/client";
import { iconOptions } from "@/lib/icon-options";
import { formatDate } from "@/lib/formatter";

export function getColumns(
  accounts: { id: number; name: string }[],
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
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("description")}</div>
      ),
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
      cell: ({ row }) => {
        const item = row.original;

        if ("category" in item && item.category) {
          const Icon = iconOptions.find(
            (icon) => icon.value === item.category?.icon
          )?.icon;
          return (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
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
