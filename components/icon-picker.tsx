"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { iconOptions } from "@/lib/icon-options";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  allowNone?: boolean;
}

export function IconPicker({
  value,
  onChange,
  label = "Select an icon",
  className,
  allowNone = false,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedIcon = iconOptions.find((opt) => opt.value === value);

  const handleIconSelect = (iconValue: string) => {
    onChange(iconValue === "none" ? "" : iconValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-12 h-12 p-0 flex items-center justify-center",
            className
          )}
        >
          {selectedIcon && <selectedIcon.icon className="h-5 w-5" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            {allowNone && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="p-0"
                onClick={() => handleIconSelect("none")}
              >
                Remove
              </Button>
            )}
          </div>
          <div className="grid grid-cols-8 gap-2">
            {iconOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={
                  selectedIcon?.value === option.value ? "default" : "outline"
                }
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handleIconSelect(option.value)}
              >
                <option.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
