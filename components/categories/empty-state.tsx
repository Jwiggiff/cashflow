import { TagIcon } from "lucide-react";

export function EmptyState() {
  return (
    <div className="text-center py-12">
      <TagIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
      <p className="text-muted-foreground mb-4">
        Categories are automatically created when you add transactions. Create your first transaction to get started.
      </p>
    </div>
  );
} 