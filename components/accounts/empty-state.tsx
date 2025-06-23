"use client";

import { AddAccountDialog } from "./add-account-dialog";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome to CashFlow</h1>
        <p className="text-muted-foreground max-w-md">
          Get started by creating your first account. You can add checking, savings, investment, or credit card accounts.
        </p>
        <div className="pt-4">
          <AddAccountDialog />
        </div>
      </div>
    </div>
  );
} 