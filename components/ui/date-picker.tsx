"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "./input";
import { useState } from "react";
import { parseDate } from "chrono-node";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [inputValue, setInputValue] = useState(date ? format(date, "PPP") : "");
  const [month, setMonth] = useState(date ? date : new Date());

  const handleTextInputSubmit = () => {
    const parsedDate = parseDate(inputValue);
    if (parsedDate) {
      setInputValue(format(parsedDate, "PPP"));
      setMonth(parsedDate);
      onDateChange?.(parsedDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-3 border-b">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTextInputSubmit();
            }}
            placeholder="e.g. feb 24, today, tomorrow"
            className="h-9"
          />
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={{ after: new Date() }}
          month={month}
          onMonthChange={setMonth}
        />
      </PopoverContent>
    </Popover>
  );
}
