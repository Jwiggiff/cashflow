"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, PencilIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { AccountType, Account } from "@prisma/client";
import { createAccount, updateAccount } from "@/app/accounts/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/currency-input";

interface AccountDialogProps {
  mode?: "add" | "edit";
  account?: Account;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AccountDialog({ 
  mode = "add", 
  account, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  trigger 
}: AccountDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [balance, setBalance] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  // Initialize form with account data when editing
  useEffect(() => {
    if (mode === "edit" && account) {
      setName(account.name);
      setType(account.type);
      setBalance(account.balance.toFixed(2));
    } else {
      // Reset form for add mode
      setName("");
      setType("");
      setBalance("");
    }
  }, [mode, account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || !balance) return;

    setIsSubmitting(true);
    try {
      const data = {
        name,
        type: type as AccountType,
        balance: parseFloat(balance),
      };

      const result = mode === "edit" && account
        ? await updateAccount(account.id, data)
        : await createAccount(data);

      if (result.success) {
        toast.success(mode === "edit" ? "Account updated successfully" : "Account created successfully");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${mode} account`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(`Failed to ${mode} account:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = mode === "edit" ? (
    <Button size="icon" variant="ghost" aria-label="Edit account">
      <PencilIcon className="h-4 w-4" />
    </Button>
  ) : (
    <Button size="sm" variant="outline" className="h-8">
      <PlusIcon className="h-4 w-4 mr-2" />
      Add Account
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Account" : "Add New Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Checking"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as AccountType)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(AccountType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">{mode === "edit" ? "Balance" : "Initial Balance"}</Label>
            <CurrencyInput value={balance} onChange={setBalance} />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === "edit" ? "Updating..." : "Adding...") : (mode === "edit" ? "Update Account" : "Add Account")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 