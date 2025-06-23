"use client";

import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";
import { TransactionWithAccount } from "@/lib/types";

interface TransactionsTableProps {
  transactions: TransactionWithAccount[];
  accounts: { id: number; name: string; }[];
}

export function TransactionsTable({ transactions, accounts }: TransactionsTableProps) {
  const columns = getColumns(accounts);
  
  return <DataTable columns={columns} data={transactions} />;
} 