import Link from "next/link";

import { InvoiceRowActions } from "@/components/invoices/invoice-row-actions";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/invoices/calculations";
import { formatDate } from "@/lib/invoices/status";
import type { InvoiceListItem } from "@/lib/invoices/types";

export function InvoiceTable({
  items,
  showActions = true,
}: {
  items: InvoiceListItem[];
  showActions?: boolean;
}) {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Number</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="hidden md:table-cell">Invoice date</TableHead>
            <TableHead className="hidden sm:table-cell">Due date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            {showActions ? (
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((invoice) => (
            <TableRow
              key={invoice.id}
              data-overdue={invoice.displayStatus === "overdue" || undefined}
              className="data-overdue:bg-destructive/5"
            >
              <TableCell className="pl-4 font-medium">
                <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                  {invoice.invoice_number ?? "Draft"}
                </Link>
              </TableCell>
              <TableCell className="max-w-40 truncate">{invoice.clientName}</TableCell>
              <TableCell className="hidden md:table-cell">{formatDate(invoice.invoice_date)}</TableCell>
              <TableCell
                className={
                  invoice.displayStatus === "overdue"
                    ? "hidden font-medium text-destructive sm:table-cell"
                    : "hidden sm:table-cell"
                }
              >
                {formatDate(invoice.due_date)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(invoice.total, invoice.currency)}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.displayStatus} />
              </TableCell>
              {showActions ? (
                <TableCell className="pr-4 text-right">
                  <InvoiceRowActions invoice={invoice} />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
