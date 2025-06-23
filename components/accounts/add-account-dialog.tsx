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
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { AccountType } from "@prisma/client";
import { createAccount } from "../../app/accounts/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/currency-input";

export function AddAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || !balance) return;

    setIsSubmitting(true);
    try {
      const result = await createAccount({
        name,
        type: type as AccountType,
        balance: parseFloat(balance),
      });

      if (result.success) {
        toast.success("Account created successfully");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create account");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Failed to create account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
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
            <Label htmlFor="balance">Initial Balance</Label>
            <CurrencyInput value={balance} onChange={setBalance} />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
