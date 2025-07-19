import { usePrivacy } from "@/components/privacy-provider";
import { formatCurrency } from "@/lib/formatter";

export function useFormatters() {
  const { isPrivate, isLoading } = usePrivacy();

  // During loading, use the default state (true) to match server-side rendering
  const effectiveIsPrivate = isLoading ? true : isPrivate;

  const formatCurrencyWithPrivacy = (amount: number) => {
    if (!effectiveIsPrivate) {
      return formatCurrency(amount);
    }
    
    const magnitude = Math.abs(amount);
    
    const scale = Math.floor(Math.log10(magnitude));
    const bulletCount = Math.min(Math.max(scale + 2, 2), 8);
    
    return `$${"•".repeat(bulletCount)}`;
  };

  const formatPercentageWithPrivacy = (value: number) => {
    if (effectiveIsPrivate) {
      return "•••%";
    }
    return `${value.toFixed(1)}%`;
  };

  return {
    formatCurrency: formatCurrencyWithPrivacy,
    formatPercentage: formatPercentageWithPrivacy,
    isPrivate: effectiveIsPrivate,
  };
} 