export type DisplayStatus = "draft" | "unpaid" | "overdue" | "paid";

export const DISPLAY_STATUS_LABELS: Record<DisplayStatus, string> = {
  draft: "Draft",
  unpaid: "Unpaid",
  overdue: "Overdue",
  paid: "Paid",
};

/** Calendar date in UTC as `YYYY-MM-DD`, the same shape Postgres returns for `date`. */
export function todayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Overdue is derived from the due date and never stored. */
export function getDisplayStatus(invoice: {
  status: string;
  payment_status: string;
  due_date: string;
}): DisplayStatus {
  if (invoice.status === "draft") {
    return "draft";
  }
  if (invoice.payment_status === "paid") {
    return "paid";
  }
  return invoice.due_date < todayIsoDate() ? "overdue" : "unpaid";
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

export function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
