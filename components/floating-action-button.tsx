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
import { Account } from "@prisma/client";

interface FloatingActionButtonProps {
  accounts: Account[];
  className?: string;
}

export function FloatingActionButton({
  accounts,
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
          <Button
            size="lg"
            className={`fixed bottom-12 right-12 z-50 h-12 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}
          >
            <PlusIcon className="!w-5 !h-5 mr-2" />
            Add
          </Button>
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
