import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

export interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  className,
  required,
}: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return;
    }
    // Limit to 2 decimal places
    if (parts[1]?.length > 2) {
      return;
    }
    onChange(numericValue);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center h-full">
        $
      </span>
      <Input
        id="balance"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        className={cn("pl-7", className)}
        placeholder="0.00"
        required={required}
      />
    </div>
  );
}
