import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll(/[^a-z0-9_]/g, "");
}

export function capitalize(str: string) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatChange(change: number) {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% from last month`;
}

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  // Use the system's local timezone if NEXT_PUBLIC_TZ is not set
  const timeZone = process.env.NEXT_PUBLIC_TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone,
  }).format(date);
}
