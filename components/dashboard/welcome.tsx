"use client";

import { AccountDialog } from "@/components/accounts/account-dialog";
import { AuthBrand } from "@/components/auth/auth-brand";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Welcome() {
  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between border-b bg-background/95 pb-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80 @3xl:static @3xl:mx-0 @3xl:border-b-0 @3xl:bg-transparent @3xl:p-4 @3xl:backdrop-blur-none">
        <SidebarTrigger className="-ml-0.5" />
        <PrivacyToggle />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center bg-pattern p-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <AuthBrand />
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome to CashFlow
            </h1>
            <p className="text-muted-foreground">
              Get started by creating your first account. You can add checking,
              savings, investment, or credit card accounts.
            </p>
          </div>
          <AccountDialog mode="add" trigger={<Button size="lg">Add account</Button>} />
        </div>
      </div>
    </div>
  );
}
