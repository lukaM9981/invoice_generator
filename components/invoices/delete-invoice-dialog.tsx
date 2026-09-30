"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteInvoice } from "@/lib/invoices/actions";

export function DeleteInvoiceDialog({
  invoice,
  onOpenChange,
  redirectTo,
}: {
  invoice: { id: string; invoice_number: string | null } | null;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [shown, setShown] = useState(invoice);

  if (invoice && invoice !== shown) {
    setShown(invoice);
  }

  async function onConfirm() {
    if (!invoice || pending) {
      return;
    }
    setPending(true);
    const result = await deleteInvoice(invoice.id);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Invoice deleted.");
    onOpenChange(false);
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <AlertDialog
      open={invoice !== null}
      onOpenChange={(open) => {
        if (!pending) {
          onOpenChange(open);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {shown?.invoice_number ? `Delete invoice ${shown.invoice_number}?` : "Delete this draft?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {shown?.invoice_number
              ? "The invoice, its PDFs, and its send history are removed. Any open payment link is cancelled. This can't be undone."
              : "The draft is removed for good. This can't be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
