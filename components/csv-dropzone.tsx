"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload } from "lucide-react";

interface CSVDropzoneProps {
  onFileDrop: (file: File) => void;
}

export function CSVDropzone({ onFileDrop }: CSVDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isFile = e.dataTransfer?.types.includes("Files");
    if (isFile) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only hide if we're leaving the window entirely
    if (
      e.clientX <= 0 ||
      e.clientY <= 0 ||
      e.clientX >= window.innerWidth ||
      e.clientY >= window.innerHeight
    ) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const csvFile = files.find(
        (file) =>
          file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")
      );

      if (csvFile) {
        onFileDrop(csvFile);
      }
    },
    [onFileDrop]
  );

  useEffect(() => {
    document.addEventListener("dragover", handleDragOver);
  }, [handleDragOver]);

  return (
    <>
      {isDragOver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-200"
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="relative rounded-lg p-8 shadow-lg">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Drop CSV file here</h3>
                <p className="text-sm text-muted-foreground">
                  Release to import your transactions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
