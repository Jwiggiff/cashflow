"use client";

import { bulkImportTransactions } from "@/app/transactions/actions";
import { Button } from "@/components/ui/button";
import { parseCSV, type CSVTransaction } from "@/lib/csv-parser";
import { BankAccount } from "@prisma/client";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { CSVDropzone } from "./csv-dropzone";
import { CSVPreview } from "./csv-preview";

interface CSVDropzoneWrapperProps {
  accounts: BankAccount[];
  canAutoCategorize: boolean;
  children?: ReactNode;
}

type CSVImportContextValue = {
  openFilePicker: () => void;
  hasAccounts: boolean;
};

const CSVImportContext = createContext<CSVImportContextValue | null>(null);

export function useCSVImport() {
  return useContext(CSVImportContext);
}

export function CSVImportButton({
  variant = "outline",
  size = "sm",
  className,
}: {
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "icon";
  className?: string;
}) {
  const csvImport = useCSVImport();

  if (!csvImport?.hasAccounts) return null;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={csvImport.openFilePicker}
    >
      <Upload className="size-4" />
      <span className="hidden sm:inline">Import CSV</span>
      <span className="sm:hidden">Import</span>
    </Button>
  );
}

export function CSVDropzoneWrapper({
  accounts,
  canAutoCategorize,
  children,
}: CSVDropzoneWrapperProps) {
  const [previewData, setPreviewData] = useState<{
    transactions: CSVTransaction[];
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleCSVFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const transactions = parseCSV(text);

      setPreviewData({
        transactions,
        fileName: file.name,
      });
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error(
        "Failed to parse CSV file. Please check the format and try again."
      );
    }
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImport = async (
    transactions: CSVTransaction[],
    accountId: number,
    autoCategorize: boolean
  ) => {
    try {
      const result = await bulkImportTransactions(
        transactions,
        accountId,
        autoCategorize
      );

      if (result.success) {
        toast.success(result.message);
        setPreviewData(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to import transactions");
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("An unexpected error occurred during import");
    }
  };

  return (
    <CSVImportContext.Provider
      value={{
        openFilePicker,
        hasAccounts: accounts.length > 0,
      }}
    >
      {children}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleCSVFile(file);
          }
          event.target.value = "";
        }}
      />
      <CSVDropzone onFileDrop={handleCSVFile} />
      {previewData && (
        <CSVPreview
          transactions={previewData.transactions}
          fileName={previewData.fileName}
          accounts={accounts}
          onImport={handleImport}
          onCancel={() => setPreviewData(null)}
          canAutoCategorize={canAutoCategorize}
        />
      )}
    </CSVImportContext.Provider>
  );
}
