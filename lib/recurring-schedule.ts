import { RRule } from "rrule";

/** Local midnight for the given date, used for date-only (not time-of-day) comparisons. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Computes the `nextDueDate` for a newly-created recurring transaction/transfer.
 *
 * `startDate` is a user-facing field that can legitimately be historical
 * (e.g. a dashboard suggestion seeded from a past transaction) or in the
 * future (a manual create for something starting later). Scheduling the
 * first real occurrence directly at `startDate` is only correct for
 * today-or-future dates - for a past `startDate`, it would fire a
 * backdated transaction on the very next cron tick (`nextDueDate <= now`),
 * which is almost always a duplicate of something already in the ledger.
 *
 * So: a past start date jumps forward to the rule's next occurrence on/after
 * today; a today-or-future start date is honored exactly as chosen; it's
 * already guaranteed to be a valid occurrence of `rrule` by construction
 * (the recurrence pattern is derived from `startDate` itself).
 */
export function computeNextDueDateForCreate(
  rrule: RRule,
  startDate: Date,
  now: Date = new Date()
): Date {
  if (startDate < startOfDay(now)) {
    return rrule.after(now, true) ?? startDate;
  }
  return startDate;
}
