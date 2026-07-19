"use client";

import type { DashboardRecurringPatternRecommendation } from "@/lib/recommendations/detect-recurring-patterns";
import type { BankAccount, Category } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormatters } from "@/hooks/use-formatters";
import {
  RecurringTransactionDialog,
  type RecurringTransactionPrefill,
} from "@/components/recurring/recurring-transaction-dialog";
import {
  RecurringTransferDialog,
  type RecurringTransferPrefill,
} from "@/components/recurring/recurring-transfer-dialog";

const INITIAL_VISIBLE = 2;

type Props = {
  recommendations: DashboardRecurringPatternRecommendation[];
  accounts: BankAccount[];
  categories: Category[];
};

function recommendationTitle(rec: DashboardRecurringPatternRecommendation) {
  if (rec.kind === "transaction") {
    return rec.description || "Recurring transaction";
  }

  const description = rec.description.trim();
  if (description && description.toLowerCase() !== "transfer") {
    return description;
  }

  return `${rec.fromAccountName} → ${rec.toAccountName}`;
}

function recommendationDetail(
  rec: DashboardRecurringPatternRecommendation,
  formatCurrency: (n: number) => string
) {
  if (rec.kind === "transaction") {
    return [
      formatCurrency(rec.displayAmount),
      rec.patternSummary,
      rec.accountName,
    ].join(" · ");
  }

  const description = rec.description.trim();
  const route =
    description && description.toLowerCase() !== "transfer"
      ? `${rec.fromAccountName} → ${rec.toAccountName}`
      : null;

  return [formatCurrency(rec.amount), rec.patternSummary, route]
    .filter(Boolean)
    .join(" · ");
}

export function DashboardRecommendations({
  recommendations,
  accounts,
  categories,
}: Props) {
  const router = useRouter();
  const { formatCurrency } = useFormatters();
  const [expanded, setExpanded] = useState(false);

  const [txOpen, setTxOpen] = useState(false);
  const [txPrefill, setTxPrefill] =
    useState<RecurringTransactionPrefill | null>(null);
  const [tfOpen, setTfOpen] = useState(false);
  const [tfPrefill, setTfPrefill] = useState<RecurringTransferPrefill | null>(
    null
  );

  const refresh = () => router.refresh();
  const hasMore = recommendations.length > INITIAL_VISIBLE;
  const visibleRecommendations =
    expanded || !hasMore
      ? recommendations
      : recommendations.slice(0, INITIAL_VISIBLE);
  const hiddenCount = recommendations.length - INITIAL_VISIBLE;

  const openTransaction = (
    r: Extract<
      DashboardRecurringPatternRecommendation,
      { kind: "transaction" }
    >
  ) => {
    setTxPrefill({
      description: r.description,
      amount: r.displayAmount,
      type: r.transactionType,
      accountId: r.accountId,
      startDate: new Date(r.startDateIso),
      rrule: r.rrule,
    });
    setTxOpen(true);
  };

  const openTransfer = (
    r: Extract<DashboardRecurringPatternRecommendation, { kind: "transfer" }>
  ) => {
    setTfPrefill({
      amount: r.amount,
      description: r.description,
      fromAccountId: r.fromAccountId,
      toAccountId: r.toAccountId,
      startDate: new Date(r.startDateIso),
      rrule: r.rrule,
    });
    setTfOpen(true);
  };

  return (
    <>
      <div className="mt-0 w-full @3xl:mt-8">
        <Card className="-mx-4 gap-4 rounded-none border-x-0 py-4 shadow-none @3xl:mx-0 @3xl:w-full @3xl:gap-6 @3xl:rounded-xl @3xl:border @3xl:py-6 @3xl:shadow-sm">
          <CardHeader className="px-4 @3xl:px-6">
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {recommendations.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground @3xl:px-6">
                No recommendations at the moment.
              </div>
            ) : (
              <>
                <ul className="divide-y border-t">
                  {visibleRecommendations.map((rec) => (
                    <li
                      key={rec.id}
                      className="group flex items-center gap-3 px-4 py-3 @3xl:px-6"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Repeat className="size-4" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {recommendationTitle(rec)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {recommendationDetail(rec, formatCurrency)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 opacity-100 transition-opacity @3xl:opacity-0 @3xl:group-hover:opacity-100 @3xl:group-focus-within:opacity-100"
                        aria-label={
                          rec.kind === "transaction"
                            ? "Create recurring transaction"
                            : "Create recurring transfer"
                        }
                        onClick={() =>
                          rec.kind === "transaction"
                            ? openTransaction(rec)
                            : openTransfer(rec)
                        }
                      >
                        <Plus className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>

                {hasMore && (
                  <div className="border-t px-4 pt-3 @3xl:px-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => setExpanded((value) => !value)}
                      aria-expanded={expanded}
                    >
                      {expanded ? (
                        <>
                          Show less
                          <ChevronUp />
                        </>
                      ) : (
                        <>
                          Show {hiddenCount} more
                          <ChevronDown />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <RecurringTransactionDialog
        open={txOpen}
        onOpenChange={(open) => {
          setTxOpen(open);
          if (!open) setTxPrefill(null);
        }}
        prefillForCreate={txPrefill}
        accounts={accounts}
        categories={categories}
        onSuccess={refresh}
      />

      <RecurringTransferDialog
        accounts={accounts}
        mode="add"
        open={tfOpen}
        onOpenChange={(open) => {
          setTfOpen(open);
          if (!open) setTfPrefill(null);
        }}
        prefillForCreate={tfPrefill}
        onSuccess={refresh}
      />
    </>
  );
}
