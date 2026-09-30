"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";
import {
  SendInvoiceDialog,
  type SendDialogDefaults,
} from "@/components/invoices/send-invoice-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { markInvoicePaid, markInvoiceUnpaid } from "@/lib/invoices/actions";

export function InvoiceDetailActions({
  invoice,
  sendDefaults,
  paymentsReady,
  openSendOnLoad,
}: {
  invoice: {
    id: string;
    invoice_number: string | null;
    status: "draft" | "finalized";
    payment_status: "unpaid" | "paid";
    hasPdf: boolean;
    hasClientEmail: boolean;
  };
  sendDefaults: SendDialogDefaults | null;
  paymentsReady: boolean;
  openSendOnLoad: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isDraft = invoice.status === "draft";
  const isPaid = invoice.payment_status === "paid";
  const canSend = !isDraft && sendDefaults !== null && invoice.invoice_number !== null;

  const [sendOpen, setSendOpen] = useState(canSend && openSendOnLoad);
  const [sendKey, setSendKey] = useState(0);
  const [deleting, setDeleting] = useState<typeof invoice | null>(null);
  const [pending, setPending] = useState(false);

  async function togglePaid() {
    setPending(true);
    const result = isPaid
      ? await markInvoiceUnpaid(invoice.id)
      : await markInvoicePaid(invoice.id);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isPaid ? "Marked as unpaid." : "Marked as paid.");
    router.refresh();
  }

  const pdfUrl = `/api/invoices/${invoice.id}/pdf`;

  return (
    <div className="flex flex-wrap gap-2">
      {canSend ? (
        <Button
          type="button"
          onClick={() => {
            setSendKey((key) => key + 1);
            setSendOpen(true);
          }}
        >
          {isPaid ? "Send again" : "Send"}
        </Button>
      ) : null}

      {!isPaid ? (
        <Link
          href={`/invoices/${invoice.id}/edit`}
          className={buttonVariants({ variant: isDraft ? "default" : "outline" })}
        >
          {isDraft ? "Continue editing" : "Edit"}
        </Link>
      ) : null}

      {!isDraft && invoice.hasPdf ? (
        <>
          <a href={pdfUrl} className={buttonVariants({ variant: "outline" })}>
            Download PDF
          </a>
          <a
            href={`${pdfUrl}?disposition=inline`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            Open PDF
          </a>
        </>
      ) : null}

      {!isDraft ? (
        <Button type="button" variant="outline" disabled={pending} onClick={togglePaid}>
          {pending ? "Saving…" : isPaid ? "Mark as unpaid" : "Mark as paid"}
        </Button>
      ) : null}

      {!isPaid ? (
        <Button type="button" variant="destructive" onClick={() => setDeleting(invoice)}>
          Delete
        </Button>
      ) : null}

      {canSend ? (
        <SendInvoiceDialog
          key={sendKey}
          open={sendOpen}
          onOpenChange={(open) => {
            setSendOpen(open);
            if (!open && openSendOnLoad) {
              router.replace(pathname);
            }
          }}
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoice_number!}
          defaults={sendDefaults!}
          isPaid={isPaid}
          paymentsReady={paymentsReady}
          hasSavedEmail={invoice.hasClientEmail}
        />
      ) : null}

      <DeleteInvoiceDialog
        invoice={deleting}
        redirectTo="/invoices"
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
