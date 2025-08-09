"use client";

import {
  PlusIcon,
  CreditCardIcon,
  ArrowLeftRightIcon,
  LandmarkIcon,
  RepeatIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransferDialog } from "@/components/transactions/transfer-dialog";
import { RecurringTransactionDialog } from "@/components/recurring/recurring-transaction-dialog";
import { RecurringTransferDialog } from "@/components/recurring/recurring-transfer-dialog";
import { useState } from "react";
import { BankAccount, Category } from "@prisma/client";
import { SidebarMenuButton } from "./ui/sidebar";

interface FloatingActionButtonProps {
  accounts: BankAccount[];
  categories: Category[];
}

export function AddButton({ accounts, categories }: FloatingActionButtonProps) {
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [recurringTransactionDialogOpen, setRecurringTransactionDialogOpen] =
    useState(false);
  const [recurringTransferDialogOpen, setRecurringTransferDialogOpen] =
    useState(false);

  const handleAddAccount = () => {
    setAccountDialogOpen(true);
  };

  const handleAddTransaction = () => {
    setTransactionDialogOpen(true);
  };

  const handleAddTransfer = () => {
    setTransferDialogOpen(true);
  };

  const handleAddRecurringTransaction = () => {
    setRecurringTransactionDialogOpen(true);
  };

  const handleAddRecurringTransfer = () => {
    setRecurringTransferDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground my-2">
            <PlusIcon className="h-4 w-4" />
            Add
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleAddAccount}>
            <LandmarkIcon className="mr-2 h-4 w-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddTransaction}>
            <CreditCardIcon className="mr-2 h-4 w-4" />
            Transaction
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddTransfer}>
            <ArrowLeftRightIcon className="mr-2 h-4 w-4" />
            Transfer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddRecurringTransaction}>
            <RepeatIcon className="mr-2 h-4 w-4" />
            Recurring Transaction
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddRecurringTransfer}>
            <RepeatIcon className="mr-2 h-4 w-4" />
            Recurring Transfer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
      />

      <TransactionDialog
        accounts={accounts}
        categories={categories}
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
      />

      <TransferDialog
        accounts={accounts}
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
      />

      <RecurringTransactionDialog
        accounts={accounts}
        categories={categories}
        open={recurringTransactionDialogOpen}
        onOpenChange={setRecurringTransactionDialogOpen}
        onSuccess={() => {
          setRecurringTransactionDialogOpen(false);
          window.location.reload();
        }}
      />

      <RecurringTransferDialog
        accounts={accounts}
        open={recurringTransferDialogOpen}
        onOpenChange={setRecurringTransferDialogOpen}
        onSuccess={() => {
          setRecurringTransferDialogOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
}
