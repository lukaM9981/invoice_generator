"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiMoreLine } from "@remixicon/react";
import { toast } from "sonner";

import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markInvoicePaid } from "@/lib/invoices/actions";
import type { InvoiceListItem } from "@/lib/invoices/types";

export function InvoiceRowActions({ invoice }: { invoice: InvoiceListItem }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<InvoiceListItem | null>(null);
  const isDraft = invoice.status === "draft";
  const isPaid = invoice.payment_status === "paid";

  async function onMarkPaid() {
    const result = await markInvoicePaid(invoice.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Invoice ${invoice.invoice_number} marked as paid.`);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${invoice.invoice_number ?? "draft"}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <RiMoreLine />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href={`/invoices/${invoice.id}`} />}>View</DropdownMenuItem>
            {!isPaid ? (
              <DropdownMenuItem render={<Link href={`/invoices/${invoice.id}/edit`} />}>
                Edit
              </DropdownMenuItem>
            ) : null}
            {!isDraft ? (
              <>
                <DropdownMenuItem render={<Link href={`/invoices/${invoice.id}?send=1`} />}>
                  {invoice.send_count > 0 ? "Send again" : "Send"}
                </DropdownMenuItem>
                <DropdownMenuItem render={<a href={`/api/invoices/${invoice.id}/pdf`} />}>
                  Download PDF
                </DropdownMenuItem>
              </>
            ) : null}
            {!isDraft && !isPaid ? (
              <DropdownMenuItem onClick={onMarkPaid}>Mark as paid</DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          {!isPaid ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(invoice)}>
                Delete
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteInvoiceDialog
        invoice={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
      />
    </>
  );
}
