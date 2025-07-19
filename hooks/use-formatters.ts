import { usePrivacy } from "@/components/privacy-provider";
import { formatCurrency } from "@/lib/formatter";

export function useFormatters() {
  const { isPrivate } = usePrivacy();

  const formatCurrencyWithPrivacy = (amount: number) => {
    if (!isPrivate) {
      return formatCurrency(amount);
    }
    
    const magnitude = Math.abs(amount);
    
    const scale = Math.floor(Math.log10(magnitude));
    const bulletCount = Math.min(Math.max(scale + 2, 2), 8);
    
    return `$${"•".repeat(bulletCount)}`;
  };

  const formatPercentageWithPrivacy = (value: number) => {
    if (isPrivate) {
      return "•••%";
    }
    return `${value.toFixed(1)}%`;
  };

  return {
    formatCurrency: formatCurrencyWithPrivacy,
    formatPercentage: formatPercentageWithPrivacy,
    isPrivate,
  };
} 