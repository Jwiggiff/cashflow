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
import { useState, useEffect } from "react";
import { AccountType } from "@prisma/client";
import { createAccount, updateAccount } from "@/app/accounts/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/currency-input";
import { Trash2, Plus } from "lucide-react";
import { BankAccountWithAliases } from "@/lib/types";

interface AccountDialogProps {
  mode?: "add" | "edit";
  account?: BankAccountWithAliases;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AccountDialog({
  mode = "add",
  account,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: AccountDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [balance, setBalance] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aliases, setAliases] = useState<string[]>([]);

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  // Initialize form with account data when editing
  useEffect(() => {
    if (mode === "edit" && account) {
      setName(account.name);
      setType(account.type);
      setBalance(account.balance.toFixed(2));
      setAliases(account.aliases?.map((a) => a.name) || []);
    } else {
      // Reset form for add mode
      setName("");
      setType("");
      setBalance("");
      setAliases([]);
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
        ...(mode === "edit" && { aliases }),
      };

      const result =
        mode === "edit" && account
          ? await updateAccount(account.id, data)
          : await createAccount(data);

      if (result.success) {
        toast.success(
          mode === "edit"
            ? "Account updated successfully"
            : "Account created successfully"
        );
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Account" : "Add New Account"}
          </DialogTitle>
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
            <Label htmlFor="balance">
              {mode === "edit" ? "Balance" : "Initial Balance"}
            </Label>
            <CurrencyInput
              value={balance}
              onChange={setBalance}
              allowNegative={true}
            />
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <Label>Account Aliases</Label>
              <div className="space-y-2">
                {aliases.map((alias, index) => (
                  <div key={index} className="flex items-stretch gap-2">
                    <Input
                      value={alias}
                      onChange={(e) => {
                        const newAliases = [...aliases];
                        newAliases[index] = e.target.value;
                        setAliases(newAliases);
                      }}
                      placeholder="Alias name"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto"
                      onClick={() => {
                        const newAliases = aliases.filter(
                          (_, i) => i !== index
                        );
                        setAliases(newAliases);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setAliases([...aliases, ""]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alias
                </Button>
              </div>
            </div>
          )}

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
              {isSubmitting
                ? mode === "edit"
                  ? "Updating..."
                  : "Adding..."
                : mode === "edit"
                ? "Update Account"
                : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
