"use client";

import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";
import { TransactionOrTransfer } from "@/lib/types";
import { Category } from "@prisma/client";

interface TransactionsTableProps {
  items: TransactionOrTransfer[];
  accounts: { id: number; name: string }[];
  categories: Category[];
}

export function TransactionsTable({
  items,
  accounts,
  categories,
}: TransactionsTableProps) {
  const columns = getColumns(accounts, categories);

  return (
    <DataTable
      columns={columns}
      data={items}
      accounts={accounts}
      categories={categories}
    />
  );
}
