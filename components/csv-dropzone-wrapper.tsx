"use client";

import { useState } from "react";
import { CSVDropzone } from "./csv-dropzone";
import { CSVPreview } from "./csv-preview";
import { parseCSV, CSVTransaction } from "@/lib/csv-parser";
import { Account } from "@prisma/client";
import { bulkImportTransactions } from "@/app/transactions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CSVDropzoneWrapperProps {
  accounts: Account[];
  canAutoCategorize: boolean;
}

export function CSVDropzoneWrapper({ accounts, canAutoCategorize }: CSVDropzoneWrapperProps) {
  const [previewData, setPreviewData] = useState<{
    transactions: CSVTransaction[];
    fileName: string;
  } | null>(null);
  const router = useRouter();
  
  const handleCSVFileDrop = async (file: File) => {
    try {
      const text = await file.text();
      const transactions = parseCSV(text);
      
      setPreviewData({
        transactions,
        fileName: file.name
      });
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error("Failed to parse CSV file. Please check the format and try again.");
    }
  };

  const handleImport = async (
    transactions: CSVTransaction[], 
    accountId: number,
    autoCategorize: boolean
  ) => {
    try {
      const result = await bulkImportTransactions(transactions, accountId, autoCategorize);
      
      if (result.success) {
        toast.success(result.message);
        setPreviewData(null);
        router.refresh(); // Refresh the page to show new transactions
      } else {
        toast.error(result.error || "Failed to import transactions");
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("An unexpected error occurred during import");
    }
  };

  const handleCancelPreview = () => {
    setPreviewData(null);
  };

  return (
    <>
      <CSVDropzone onFileDrop={handleCSVFileDrop} />
      {previewData && (
        <CSVPreview
          transactions={previewData.transactions}
          fileName={previewData.fileName}
          accounts={accounts}
          onImport={handleImport}
          onCancel={handleCancelPreview}
          canAutoCategorize={canAutoCategorize}
        />
      )}
    </>
  );
} 