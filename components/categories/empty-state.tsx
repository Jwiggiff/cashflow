"use client";

import { CategoryDialog } from "@/components/categories/category-dialog";
import { Button } from "@/components/ui/button";
import { TagIcon } from "lucide-react";

export function EmptyState() {
  return (
    <div className="py-12 text-center">
      <TagIcon className="mx-auto mb-4 size-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">No categories yet</h3>
      <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
        Create categories to organize expenses, or they can be added
        automatically when you create transactions.
      </p>
      <CategoryDialog
        trigger={<Button>Add category</Button>}
      />
    </div>
  );
}
