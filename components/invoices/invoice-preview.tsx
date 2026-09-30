import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatQuantity } from "@/lib/invoices/calculations";
import { formatDate } from "@/lib/invoices/status";
import type { InvoiceDetail, PartyDetails } from "@/lib/invoices/types";

function Party({ label, party }: { label: string; party: PartyDetails | null }) {
  const primary = party?.company_name ?? party?.full_name;
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      {primary ? <p className="font-medium">{primary}</p> : <p className="text-muted-foreground">Not set</p>}
      {party?.company_name && party.full_name ? <p>{party.full_name}</p> : null}
      {party?.address ? <p className="whitespace-pre-line text-muted-foreground">{party.address}</p> : null}
      {party?.email ? <p className="text-muted-foreground">{party.email}</p> : null}
      {party?.website ? <p className="text-muted-foreground">{party.website}</p> : null}
      {party?.vat_id ? <p className="text-muted-foreground">VAT ID: {party.vat_id}</p> : null}
    </div>
  );
}

/** On-screen mirror of the PDF layout. */
export function InvoicePreview({ invoice }: { invoice: InvoiceDetail }) {
  const money = (amount: string) => formatMoney(amount, invoice.currency);

  return (
    <div className="flex flex-col gap-8 rounded-xl border bg-card p-5 sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="font-heading text-2xl font-semibold">Invoice</p>
          <p className="text-sm text-muted-foreground">
            {invoice.invoice_number ?? "Draft, not numbered yet"}
          </p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm sm:text-right">
          <dt className="text-muted-foreground">Invoice date</dt>
          <dd className="font-medium">{formatDate(invoice.invoice_date)}</dd>
          <dt className="text-muted-foreground">Due date</dt>
          <dd className="font-medium">{formatDate(invoice.due_date)}</dd>
          <dt className="text-muted-foreground">Currency</dt>
          <dd className="font-medium">{invoice.currency}</dd>
        </dl>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Party label="From" party={invoice.sender} />
        <Party label="To" party={invoice.client} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                No rows yet.
              </TableCell>
            </TableRow>
          ) : (
            invoice.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="whitespace-normal">
                  {line.description || <span className="text-muted-foreground">No description</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQuantity(line.quantity)}
                  {line.unit_type === "hours" ? " h" : ""}
                </TableCell>
                <TableCell className="text-right tabular-nums">{money(line.unit_price)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(line.line_total)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <dl className="ml-auto grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="text-right tabular-nums">{money(invoice.subtotal)}</dd>
        <dt className="text-muted-foreground">Tax ({formatQuantity(invoice.tax_rate)}%)</dt>
        <dd className="text-right tabular-nums">{money(invoice.tax_amount)}</dd>
        <dt className="border-t pt-2 font-medium">Total</dt>
        <dd className="border-t pt-2 text-right font-medium tabular-nums">{money(invoice.total)}</dd>
      </dl>

      {invoice.comments ? (
        <div className="border-t pt-4 text-sm">
          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Comments</p>
          <p className="whitespace-pre-line">{invoice.comments}</p>
        </div>
      ) : null}
    </div>
  );
}
