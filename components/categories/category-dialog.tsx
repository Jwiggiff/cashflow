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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateCategory } from "@/app/categories/actions";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import { IconPicker } from "@/components/icon-picker";

interface CategoryDialogProps {
  category: Category;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CategoryDialog({
  category,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: CategoryDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  // Initialize form with category data
  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await updateCategory(category.id, {
        name: name.trim(),
        icon,
      });

      if (result.success) {
        toast.success("Category updated successfully");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update category");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Failed to update category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <IconPicker
              className="w-9 h-9"
              value={icon}
              onChange={setIcon}
              allowNone={true}
            />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Food & Dining"
              required
            />
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
              {isSubmitting ? "Updating..." : "Update Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
