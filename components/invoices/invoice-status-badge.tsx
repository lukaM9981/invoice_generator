import { Badge } from "@/components/ui/badge";
import { DISPLAY_STATUS_LABELS, type DisplayStatus } from "@/lib/invoices/status";

const VARIANTS = {
  draft: "outline",
  unpaid: "secondary",
  overdue: "destructive",
  paid: "default",
} as const;

export function InvoiceStatusBadge({ status }: { status: DisplayStatus }) {
  return <Badge variant={VARIANTS[status]}>{DISPLAY_STATUS_LABELS[status]}</Badge>;
}
