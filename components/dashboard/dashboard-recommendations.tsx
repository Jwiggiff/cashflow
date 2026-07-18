"use client";

import type { DashboardRecurringPatternRecommendation } from "@/lib/recommendations/detect-recurring-patterns";
import type { BankAccount, Category } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Repeat } from "lucide-react";
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

type Props = {
  recommendations: DashboardRecurringPatternRecommendation[];
  accounts: BankAccount[];
  categories: Category[];
};

function recommendationSentence(
  rec: DashboardRecurringPatternRecommendation,
  formatCurrency: (n: number) => string,
): string {
  const freq =
    rec.patternSummary.charAt(0).toLowerCase() + rec.patternSummary.slice(1);

  if (rec.kind === "transaction") {
    const prep = rec.transactionType === "INCOME" ? "into" : "from";
    return `Recurring ${rec.transactionType.toLowerCase()} "${rec.description}" ${freq} for ${formatCurrency(rec.displayAmount)} ${prep} ${rec.accountName}`;
  }

  const base = `Recurring transfer from ${rec.fromAccountName} to ${rec.toAccountName} ${freq} for ${formatCurrency(rec.amount)}`;
  return rec.description.trim().toLowerCase() !== "transfer" ? `${base} (${rec.description.trim()})` : base;
}

export function DashboardRecommendations({
  recommendations,
  accounts,
  categories,
}: Props) {
  const router = useRouter();
  const { formatCurrency } = useFormatters();

  const [txOpen, setTxOpen] = useState(false);
  const [txPrefill, setTxPrefill] =
    useState<RecurringTransactionPrefill | null>(null);
  const [tfOpen, setTfOpen] = useState(false);
  const [tfPrefill, setTfPrefill] = useState<RecurringTransferPrefill | null>(
    null,
  );

  const refresh = () => router.refresh();

  const openTransaction = (
    r: Extract<
      DashboardRecurringPatternRecommendation,
      { kind: "transaction" }
    >,
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
    r: Extract<DashboardRecurringPatternRecommendation, { kind: "transfer" }>,
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
        <Card className="-mx-8 gap-4 rounded-none border-x-0 py-4 shadow-none @3xl:mx-0 @3xl:w-full @3xl:gap-6 @3xl:rounded-xl @3xl:border @3xl:py-6 @3xl:shadow-sm">
          <CardHeader className="px-8 @3xl:px-6">
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="divide-y px-8 @3xl:px-6">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="group flex items-start gap-2 sm:items-center"
              >
                <Repeat
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground sm:mt-0"
                  aria-hidden
                />
                <p className="min-w-0 flex-1 text-sm leading-snug text-foreground">
                  {recommendationSentence(rec, formatCurrency)}
                </p>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
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
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {recommendations.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No recommendations at the moment.
              </div>
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
