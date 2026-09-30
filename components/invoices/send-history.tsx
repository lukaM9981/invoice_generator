import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/invoices/status";
import type { InvoiceSendRecord } from "@/lib/invoices/types";

export function SendHistory({ sends }: { sends: InvoiceSendRecord[] }) {
  if (sends.length === 0) {
    return <p className="text-sm text-muted-foreground">Not sent yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y">
      {sends.map((send) => (
        <li key={send.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={send.status === "sent" ? "secondary" : "destructive"}>
              {send.status === "sent" ? "Sent" : "Failed"}
            </Badge>
            <span className="text-sm">{formatDateTime(send.created_at)}</span>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            To {send.to_email}
            {send.pdf_version ? ` · PDF version ${send.pdf_version}` : ""}
            {send.payment_link_url ? " · with payment link" : ""}
          </p>
          {send.error_message ? (
            <p className="text-sm text-destructive">{send.error_message}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
