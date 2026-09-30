import { formatMoney, formatQuantity, type InvoiceTotals } from "@/lib/invoices/calculations";

export function TotalsSummary({
  totals,
  currency,
  taxRate,
}: {
  totals: InvoiceTotals;
  currency: string;
  taxRate: string;
}) {
  return (
    <dl className="ml-auto grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm">
      <dt className="text-muted-foreground">Subtotal</dt>
      <dd className="text-right tabular-nums">{formatMoney(totals.subtotal, currency)}</dd>
      <dt className="text-muted-foreground">Tax ({formatQuantity(taxRate)}%)</dt>
      <dd className="text-right tabular-nums">{formatMoney(totals.taxAmount, currency)}</dd>
      <dt className="border-t pt-2 font-medium">Total</dt>
      <dd className="border-t pt-2 text-right font-medium tabular-nums">
        {formatMoney(totals.total, currency)}
      </dd>
    </dl>
  );
}
