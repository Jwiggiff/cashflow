"use client";

import {
  PlusIcon,
  CreditCardIcon,
  ArrowLeftRightIcon,
  LandmarkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransferDialog } from "@/components/transactions/transfer-dialog";
import { useState } from "react";
import { BankAccount, Category } from "@prisma/client";
import { SidebarMenuButton } from "./ui/sidebar";

interface FloatingActionButtonProps {
  accounts: BankAccount[];
  categories: Category[];
  className?: string;
}

export function AddButton({
  accounts,
  categories,
  className,
}: FloatingActionButtonProps) {
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const handleAddAccount = () => {
    setAccountDialogOpen(true);
  };

  const handleAddTransaction = () => {
    setTransactionDialogOpen(true);
  };

  const handleAddTransfer = () => {
    setTransferDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="bg-primary text-primary-foreground px-4  hover:bg-primary/90 hover:text-primary-foreground my-2">
            <PlusIcon className="h-4 w-4 mr-2" />
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
    </>
  );
}
