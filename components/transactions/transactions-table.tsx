"use client";

import { bulkDeleteItems, convertTransactionsToTransfer } from "@/app/transactions/actions";
import { DataTable } from "@/components/data-table";
import { iconOptions } from "@/lib/icon-options";
import { TransactionOrTransfer } from "@/lib/types";
import { BankAccount, Category } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getColumns } from "./columns";

interface TransactionsTableProps {
  items: TransactionOrTransfer[];
  accounts: BankAccount[];
  categories: Category[];
}

export function TransactionsTable({
  items,
  accounts,
  categories,
}: TransactionsTableProps) {
  const columns = getColumns(accounts, categories);
  const router = useRouter();

  const handleDeleteSelected = async (
    selectedItems: TransactionOrTransfer[]
  ) => {
    try {
      const itemsToDelete = selectedItems.map((item) => ({
        id: item.id,
        type: item.type,
      }));

      const result = await bulkDeleteItems(itemsToDelete);

      if (result.success) {
        const totalDeleted =
          (result.deletedTransactions || 0) + (result.deletedTransfers || 0);
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

  const handleConvertToTransfer = async (
    selectedItems: TransactionOrTransfer[]
  ) => {
    try {
      // Filter to only include transactions (not transfers)
      const transactions = selectedItems.filter(
        (item) => "account" in item && item.account
      );

      if (transactions.length !== 2) {
        toast.error("Please select exactly 2 transactions to convert to a transfer");
        return;
      }

      const transactionIds = transactions.map((item) => item.id);

      const result = await convertTransactionsToTransfer(transactionIds);

      if (result.success) {
        toast.success("Successfully converted transactions to transfer");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to convert transactions to transfer");
      }
    } catch (error) {
      console.error("Error converting to transfer:", error);
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
      onConvertToTransfer={handleConvertToTransfer}
    />
  );
}
