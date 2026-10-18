"use client";

import { createCategory, updateCategory } from "@/app/categories/actions";
import { IconPicker } from "@/components/icon-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Category } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CategoryDialogProps {
  category?: Category;
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
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={category ? "Edit Category" : "Add Category"}
    >
      <CategoryForm category={category} onClose={() => onOpenChange(false)} />
    </ResponsiveDialog>
  );
}

interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
}

// Radix unmounts dialog content on close, so this mounts fresh on each open.
function CategoryForm({ category, onClose }: CategoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState<string | null>(category?.icon ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateCategory(category!.id, { name: name.trim(), icon })
        : await createCategory({ name: name.trim(), icon: icon ?? undefined });

      if (result.success) {
        toast.success(
          isEdit ? "Category updated successfully" : "Category created successfully"
        );
        onClose();
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEdit ? "update" : "create"} category`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(`Failed to ${isEdit ? "update" : "create"} category:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEdit
              ? "Updating..."
              : "Creating..."
            : isEdit
              ? "Update Category"
              : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
