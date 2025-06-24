"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxItem = {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export type ComboboxProps = {
  items: ComboboxItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
  onChange: (value: string) => void;
  onCreateItem?: (name: string) => Promise<void>;
  createLabel?: string;
};

export function Combobox({
  items,
  placeholder,
  searchPlaceholder,
  value,
  onChange,
  onCreateItem,
  createLabel = "Create",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const handleCreateItem = async () => {
    if (!searchValue.trim() || !onCreateItem) return;

    try {
      await onCreateItem(searchValue.trim());
      setSearchValue("");
      setOpen(false);
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const exactMatch = items.find(
    (item) => item.label.toLowerCase() === searchValue.toLowerCase()
  );

  const showCreateOption = searchValue.trim() && !exactMatch && onCreateItem;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? items.find((item) => item.value === value)?.label
            : placeholder ?? "Select..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder ?? "Search..."}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              No results found.
              {onCreateItem && (
                <div className="text-sm text-muted-foreground px-3">
                  Tip: Start typing to create a new item.
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <div className="w-4">
                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  </div>
                  {item.label}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem
                  value={`create-${searchValue}`}
                  onSelect={handleCreateItem}
                  className="text-primary"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  {createLabel} &quot;{searchValue.trim()}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
