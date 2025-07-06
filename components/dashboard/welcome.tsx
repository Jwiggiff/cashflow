"use client";

import { Button } from "../ui/button";
import { AccountDialog } from "../accounts/account-dialog";

export function Welcome() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome to CashFlow</h1>
        <p className="text-muted-foreground max-w-md">
          Get started by creating your first account. You can add checking,
          savings, investment, or credit card accounts.
        </p>
        <div className="pt-4">
          <AccountDialog mode="add" trigger={<Button>Add Account</Button>} />
        </div>
      </div>
    </div>
  );
}
