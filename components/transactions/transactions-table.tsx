"use client";

import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";
import { TransactionOrTransfer } from "@/lib/types";

interface TransactionsTableProps {
  items: TransactionOrTransfer[];
  accounts: { id: number; name: string }[];
}

export function TransactionsTable({ items, accounts }: TransactionsTableProps) {
  const columns = getColumns(accounts);

  return <DataTable columns={columns} data={items} />;
}
