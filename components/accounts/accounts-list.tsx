"use client";

import { Account } from "@prisma/client";
import { AccountType } from "@prisma/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccountActionsCell } from "./account-actions-cell";

interface AccountsListProps {
  accounts: Account[];
}

const getAccountTypeLabel = (type: AccountType) => {
  switch (type) {
    case AccountType.CREDIT:
      return "Credit Cards";
    case AccountType.CHECKING:
      return "Checking Accounts";
    case AccountType.SAVINGS:
      return "Savings Accounts";
    case AccountType.INVESTMENT:
      return "Investment Accounts";
    default:
      return "Other Accounts";
  }
};

export function AccountsList({ accounts }: AccountsListProps) {
  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  // Define the desired order and ensure all types are included
  const desiredOrder = [
    AccountType.CREDIT,
    AccountType.CHECKING,
    AccountType.SAVINGS,
    AccountType.INVESTMENT,
  ];

  // Initialize all account types with empty arrays if they don't exist
  desiredOrder.forEach((type) => {
    if (!accountsByType[type]) {
      accountsByType[type] = [];
    }
  });

  // Sort: non-empty categories first (in desired order), then empty categories (in desired order)
  const sortedOrder = desiredOrder.sort((a, b) => {
    const aHasAccounts = accountsByType[a].length > 0;
    const bHasAccounts = accountsByType[b].length > 0;
    
    if (aHasAccounts && !bHasAccounts) return -1;
    if (!aHasAccounts && bHasAccounts) return 1;
    
    // If both have accounts or both are empty, maintain desired order
    return desiredOrder.indexOf(a) - desiredOrder.indexOf(b);
  });

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No accounts found. Create your first account to get started.
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      className="w-full space-y-2"
      defaultValue={sortedOrder.length > 0 ? [sortedOrder[0]] : []}
    >
      {sortedOrder.map((type) => (
        <AccordionItem
          key={type}
          value={type}
          className="rounded-lg !border bg-card overflow-hidden"
        >
          <AccordionTrigger className="p-3 hover:bg-accent/50 transition-colors hover:no-underline [&[data-state=open]>svg]:rotate-180">
            <div className="flex flex-col">
              <div className="text-xl font-bold">
                {getAccountTypeLabel(type)}
              </div>
              <div className="text-sm text-muted-foreground">
                {accountsByType[type].length} accounts
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            {accountsByType[type].length === 0 ? (
              <div className="p-3 text-muted-foreground border-t">
                No accounts of this type
              </div>
            ) : (
              accountsByType[type].map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 border-t hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{account.name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">
                        $
                        {account.balance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <AccountActionsCell account={account} />
                  </div>
                </div>
              ))
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
