"use client";

import {
  PlusIcon,
  CreditCardIcon,
  ArrowLeftRightIcon,
  LandmarkIcon,
  RepeatIcon,
  TagIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransferDialog } from "@/components/transactions/transfer-dialog";
import { RecurringTransactionDialog } from "@/components/recurring/recurring-transaction-dialog";
import { RecurringTransferDialog } from "@/components/recurring/recurring-transfer-dialog";
import { useEffect, useState } from "react";
import { BankAccount, Category } from "@prisma/client";
import { Kbd } from "@/components/ui/kbd";
import { SidebarMenuButton } from "./ui/sidebar";

interface FloatingActionButtonProps {
  accounts: BankAccount[];
  categories: Category[];
}

function isInputFocused() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || el.getAttribute("contenteditable") === "true";
}

export function AddButton({ accounts, categories }: FloatingActionButtonProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [recurringTransactionDialogOpen, setRecurringTransactionDialogOpen] =
    useState(false);
  const [recurringTransferDialogOpen, setRecurringTransferDialogOpen] =
    useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "a" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !dropdownOpen &&
        !isInputFocused()
      ) {
        e.preventDefault();
        setDropdownOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dropdownOpen]);

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const actions: Record<string, () => void> = {
      a: () => { setAccountDialogOpen(true); setDropdownOpen(false); },
      c: () => { setCategoryDialogOpen(true); setDropdownOpen(false); },
      t: () => { setTransactionDialogOpen(true); setDropdownOpen(false); },
      e: () => { setTransferDialogOpen(true); setDropdownOpen(false); },
      r: () => { setRecurringTransactionDialogOpen(true); setDropdownOpen(false); },
      f: () => { setRecurringTransferDialogOpen(true); setDropdownOpen(false); },
    };
    const action = actions[key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

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

  const handleAddCategory = () => {
    setCategoryDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground my-2">
            <PlusIcon className="h-4 w-4" />
            Add
            <Kbd className="ml-auto bg-primary-foreground/20 text-primary-foreground">
              A
            </Kbd>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48"
          onKeyDown={handleMenuKeyDown}
        >
          <DropdownMenuItem onClick={handleAddAccount}>
            <LandmarkIcon className="mr-2 h-4 w-4" />
            Account
            <DropdownMenuShortcut>A</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddCategory}>
            <TagIcon className="mr-2 h-4 w-4" />
            Category
            <DropdownMenuShortcut>C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddTransaction}>
            <CreditCardIcon className="mr-2 h-4 w-4" />
            Transaction
            <DropdownMenuShortcut>T</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddTransfer}>
            <ArrowLeftRightIcon className="mr-2 h-4 w-4" />
            Transfer
            <DropdownMenuShortcut>E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddRecurringTransaction}>
            <RepeatIcon className="mr-2 h-4 w-4" />
            Recurring Transaction
            <DropdownMenuShortcut>R</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddRecurringTransfer}>
            <RepeatIcon className="mr-2 h-4 w-4" />
            Recurring Transfer
            <DropdownMenuShortcut>F</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
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
