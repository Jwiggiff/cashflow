import {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useFormatters } from "@/hooks/use-formatters";

export type CurrencyTooltipFormatterProps = {
  item: Payload<ValueType, NameType>;
};

export function CurrencyTooltipFormatter({
  item,
}: CurrencyTooltipFormatterProps) {
  const { formatCurrency } = useFormatters();
  const indicatorColor = item.payload.fill || item.color;

  return (
    <>
      <div
        className="shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg) h-2.5 w-2.5"
        style={
          {
            "--color-bg": indicatorColor,
            "--color-border": indicatorColor,
          } as React.CSSProperties
        }
      />
      <div className="flex flex-1 justify-between leading-none gap-2">
        <span className="text-muted-foreground capitalize">{item.name}</span>
        {item.value && (
          <span className="text-foreground font-mono font-medium tabular-nums">
            {formatCurrency(Number(item.value))}
          </span>
        )}
      </div>
    </>
  );
}
