import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { InvoiceEditor } from "@/components/invoices/invoice-editor";
import { invoiceIdSchema } from "@/lib/invoices/schemas";
import { getInvoiceDetail, listClientOptions } from "@/lib/invoices/queries";
import { todayIsoDate } from "@/lib/invoices/status";

export const metadata: Metadata = {
  title: "Edit invoice",
};

export default async function EditInvoicePage({
  params,
}: PageProps<"/invoices/[id]/edit">) {
  const { id } = await params;
  if (!invoiceIdSchema.safeParse(id).success) {
    notFound();
  }

  const invoice = await getInvoiceDetail(id);
  if (!invoice) {
    notFound();
  }
  if (invoice.payment_status === "paid") {
    redirect(`/invoices/${invoice.id}`);
  }

  const clients = await listClientOptions(invoice.client_id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">
          {invoice.invoice_number ? `Edit invoice ${invoice.invoice_number}` : "Edit draft"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {invoice.status === "finalized"
            ? "Saving creates a new PDF version. Earlier versions are kept."
            : "Drafts are only visible to you."}
        </p>
      </div>

      {clients ? (
        <InvoiceEditor
          invoice={invoice}
          clients={clients}
          sender={invoice.sender}
          today={todayIsoDate()}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your clients. Refresh the page and try again.
        </p>
      )}
    </div>
  );
}
