import { ColumnDef } from "@tanstack/react-table";
import { TransactionActionsCell } from "./transaction-actions-cell";
import { TransactionWithAccount } from "@/lib/types";

export function getColumns(accounts: { id: number; name: string; }[]): ColumnDef<TransactionWithAccount>[] {
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
        return (
          <div>
            {Intl.DateTimeFormat("en-US", { dateStyle: "short" }).format(date)}
          </div>
        );
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
      accessorFn: (row) => String(row.account.id),
      cell: ({ row }) => {
        const account = row.original.account;
        return <div>{account.name}</div>;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <div className="capitalize">
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </div>
        );
      },
      enableHiding: true,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div>{row.getValue("category")}</div>,
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(Math.abs(amount));

        return (
          <div
            className={`text-right font-medium ${
              amount > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {amount > 0 ? "+" : ""}
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
      cell: ({ row }) => (
        <TransactionActionsCell 
          transaction={row.original as TransactionWithAccount} 
          accounts={accounts}
        />
      ),
    },
  ];
}
