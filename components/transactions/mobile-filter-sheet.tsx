"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FilterIcon, X } from "lucide-react";
import { format } from "date-fns";
// import { BankAccount, Category } from "@prisma/client";
import { TransactionType } from "@prisma/client";
import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic";
import { Table } from "@tanstack/react-table";
import { TransactionOrTransfer } from "@/lib/types";

interface MobileFilterSheetProps {
  accounts: { id: number; name: string }[];
  categories: { id: number; name: string; icon?: string | null }[];
  table: Table<TransactionOrTransfer>;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}


export function MobileFilterSheet({
  accounts,
  categories,
  table,
  dateRange,
  setDateRange,
}: MobileFilterSheetProps) {
  const [open, setOpen] = React.useState(false);

  const handleFilterChange = (columnId: string, value: string) => {
    const column = table.getColumn(columnId);
    if (column) {
      column.setFilterValue(value);
    }
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    const dateColumn = table.getColumn("date");
    if (dateColumn) {
      if (range.from || range.to) {
        dateColumn.setFilterValue(range);
      } else {
        dateColumn.setFilterValue(undefined);
      }
    }
  };


  // Check if any filters are active
  const hasActiveFilters = 
    (table.getColumn("description")?.getFilterValue() as string) ||
    (table.getColumn("account")?.getFilterValue() as string) ||
    (table.getColumn("category")?.getFilterValue() as string) ||
    (table.getColumn("type")?.getFilterValue() as string) ||
    dateRange.from ||
    dateRange.to;

  const types = [...Object.values(TransactionType), "TRANSFER"];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <FilterIcon className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] p-4 pb-16">
        <SheetHeader>
          <SheetTitle>Filter Transactions</SheetTitle>
          <SheetDescription>
            Use the filters below to find specific transactions
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          {/* Description Filter */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Search descriptions..."
              value={(table.getColumn("description")?.getFilterValue() as string) || ""}
              onChange={(e) => handleFilterChange("description", e.target.value)}
            />
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    `${format(dateRange.from, "MMM dd")} - ${format(
                      dateRange.to,
                      "MMM dd"
                    )}`
                  ) : dateRange.from ? (
                    `From ${format(dateRange.from, "MMM dd")}`
                  ) : dateRange.to ? (
                    `Until ${format(dateRange.to, "MMM dd")}`
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) =>
                    handleDateRangeChange({
                      from: range?.from,
                      to: range?.to,
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleDateRangeChange({ from: undefined, to: undefined })
                }
                className="h-8 px-2"
              >
                Clear date range
              </Button>
            )}
          </div>

          {/* Account Filter */}
          <div className="space-y-2">
            <Label>Account</Label>
            <Select
              value={(table.getColumn("account")?.getFilterValue() as string) || "all"}
              onValueChange={(value) => handleFilterChange("account", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map(({ id, name }) => (
                  <SelectItem key={id} value={id.toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={(table.getColumn("category")?.getFilterValue() as string) || "all"}
              onValueChange={(value) => handleFilterChange("category", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      {category.icon && (
                        <DynamicIcon
                          name={category.icon as keyof typeof dynamicIconImports}
                          className="h-4 w-4"
                        />
                      )}
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select
              value={(table.getColumn("type")?.getFilterValue() as string) || "all"}
              onValueChange={(value) => handleFilterChange("type", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Button */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Component to display active filters in a compact way
export function ActiveFiltersDisplay({ 
  table,
  dateRange,
  setDateRange
}: { 
  table: Table<TransactionOrTransfer>;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}) {
  const activeFilters = [];

  const descriptionFilter = table.getColumn("description")?.getFilterValue() as string;
  if (descriptionFilter) {
    activeFilters.push({
      key: "description",
      label: `Description: "${descriptionFilter}"`,
      onRemove: () => table.getColumn("description")?.setFilterValue(""),
    });
  }

  if (dateRange.from || dateRange.to) {
    const dateLabel = dateRange.from && dateRange.to
      ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
      : dateRange.from
      ? `From ${format(dateRange.from, "MMM dd")}`
      : `Until ${format(dateRange.to!, "MMM dd")}`;
    
    activeFilters.push({
      key: "dateRange",
      label: `Date: ${dateLabel}`,
      onRemove: () => {
        setDateRange({ from: undefined, to: undefined });
        table.getColumn("date")?.setFilterValue(undefined);
      },
    });
  }

  const accountFilter = table.getColumn("account")?.getFilterValue() as string;
  if (accountFilter) {
    activeFilters.push({
      key: "account",
      label: `Account: ${accountFilter}`,
      onRemove: () => table.getColumn("account")?.setFilterValue(""),
    });
  }

  const categoryFilter = table.getColumn("category")?.getFilterValue() as string;
  if (categoryFilter) {
    activeFilters.push({
      key: "category",
      label: `Category: ${categoryFilter}`,
      onRemove: () => table.getColumn("category")?.setFilterValue(""),
    });
  }

  const typeFilter = table.getColumn("type")?.getFilterValue() as string;
  if (typeFilter) {
    activeFilters.push({
      key: "type",
      label: `Type: ${typeFilter}`,
      onRemove: () => table.getColumn("type")?.setFilterValue(""),
    });
  }

  if (activeFilters.length === 0) return null;

  const clearAllFilters = () => {
    // Clear all column filters
    table.getAllColumns().forEach((column) => {
      if (column.getCanFilter()) {
        column.setFilterValue("");
      }
    });
    // Clear date range
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {activeFilters.map((filter) => (
        <div
          key={filter.key}
          className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm"
        >
          <span className="truncate max-w-[120px]">{filter.label}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={filter.onRemove}
            className="h-4 w-4 p-0 hover:bg-blue-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={clearAllFilters}
        className="text-xs h-6 px-2"
      >
        Clear All
      </Button>
    </div>
  );
}
