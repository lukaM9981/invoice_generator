import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceDetailActions } from "@/components/invoices/invoice-detail-actions";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { SendHistory } from "@/components/invoices/send-history";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { defaultEmailContent } from "@/lib/email/defaults";
import { formatMoney } from "@/lib/invoices/calculations";
import { getInvoiceDetail } from "@/lib/invoices/queries";
import { invoiceIdSchema } from "@/lib/invoices/schemas";
import { formatDate, formatDateTime } from "@/lib/invoices/status";
import { getProfileSettings } from "@/lib/profile/queries";

export const metadata: Metadata = {
  title: "Invoice",
};

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: PageProps<"/invoices/[id]">) {
  const [{ id }, { send }] = await Promise.all([params, searchParams]);
  if (!invoiceIdSchema.safeParse(id).success) {
    notFound();
  }

  const [invoice, settings] = await Promise.all([getInvoiceDetail(id), getProfileSettings()]);
  if (!invoice) {
    notFound();
  }

  const senderName =
    invoice.sender.company_name ?? invoice.sender.full_name ?? "your business";

  const sendDefaults =
    invoice.status === "finalized" && invoice.invoice_number
      ? {
          to_email: invoice.client?.email ?? "",
          ...defaultEmailContent({
            profileSubject: settings?.emailDefaults.subject ?? null,
            profileBody: settings?.emailDefaults.body ?? null,
            senderName,
            invoiceNumber: invoice.invoice_number,
            total: invoice.total,
            currency: invoice.currency,
            dueDate: invoice.due_date,
          }),
        }
      : null;

  const sentCount = invoice.send_count;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
          ← All invoices
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-medium">
                {invoice.invoice_number ? `Invoice ${invoice.invoice_number}` : "Draft invoice"}
              </h1>
              <InvoiceStatusBadge status={invoice.displayStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {invoice.clientName} · {formatMoney(invoice.total, invoice.currency)} · due{" "}
              {formatDate(invoice.due_date)}
            </p>
          </div>
          <InvoiceDetailActions
            invoice={{
              id: invoice.id,
              invoice_number: invoice.invoice_number,
              status: invoice.status,
              payment_status: invoice.payment_status,
              hasPdf: invoice.pdfs.length > 0,
              hasClientEmail: Boolean(invoice.client?.email),
            }}
            sendDefaults={sendDefaults}
            paymentsReady={settings?.payments.state === "ready"}
            openSendOnLoad={send === "1"}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <InvoicePreview invoice={invoice} />

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>
                {invoice.status === "draft"
                  ? "Finalize the invoice to issue it."
                  : invoice.payment_status === "paid"
                    ? `Paid ${invoice.paid_at ? formatDateTime(invoice.paid_at) : ""}${
                        invoice.paid_source === "stripe" ? " through Stripe" : " (marked by you)"
                      }. The invoice is locked.`
                    : invoice.stripe_payment_link_url
                      ? "A payment link is open for the current amount."
                      : "A payment link is created the next time you send."}
              </CardDescription>
            </CardHeader>
            {invoice.stripe_payment_link_url && invoice.payment_status === "unpaid" ? (
              <CardContent>
                <a
                  href={invoice.stripe_payment_link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm break-all underline underline-offset-4"
                >
                  {invoice.stripe_payment_link_url}
                </a>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sending</CardTitle>
              <CardDescription>
                {sentCount === 0
                  ? "Not sent yet."
                  : `Sent ${sentCount} ${sentCount === 1 ? "time" : "times"}${
                      invoice.last_sent_at ? `, last on ${formatDateTime(invoice.last_sent_at)}` : ""
                    }.`}
              </CardDescription>
            </CardHeader>
            {invoice.sends.length > 0 ? (
              <CardContent>
                <SendHistory sends={invoice.sends} />
              </CardContent>
            ) : null}
          </Card>

          {invoice.pdfs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>PDF versions</CardTitle>
                <CardDescription>Every version is kept, so you can see what was sent.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm">
                  {invoice.pdfs.map((pdf, index) => (
                    <li key={pdf.id} className="flex items-center justify-between gap-3">
                      <span>
                        Version {pdf.version}
                        {index === 0 ? " (current)" : ""}
                        <span className="block text-muted-foreground">
                          {formatDateTime(pdf.created_at)}
                        </span>
                      </span>
                      <a
                        href={`/api/invoices/${invoice.id}/pdf?version=${pdf.version}`}
                        className="shrink-0 underline underline-offset-4"
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
