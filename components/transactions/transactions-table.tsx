"use client";

import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";
import { TransactionOrTransfer } from "@/lib/types";
import { Category } from "@prisma/client";
import { iconOptions } from "@/lib/icon-options";
import { bulkDeleteItems } from "@/app/transactions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleDeleteSelected = async (selectedItems: TransactionOrTransfer[]) => {
    try {
      const itemsToDelete = selectedItems.map(item => ({
        id: item.id,
        type: item.type
      }));

      const result = await bulkDeleteItems(itemsToDelete);
      
      if (result.success) {
        const totalDeleted = (result.deletedTransactions || 0) + (result.deletedTransfers || 0);
        toast.success(`Successfully deleted ${totalDeleted} items`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete selected items");
      }
    } catch (error) {
      console.error("Error deleting items:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <DataTable
      columns={columns}
      data={items}
      accounts={accounts}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        icon: category.icon as keyof typeof iconOptions,
      }))}
      onDeleteSelected={handleDeleteSelected}
    />
  );
}
