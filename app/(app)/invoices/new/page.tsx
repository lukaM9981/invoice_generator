import type { Metadata } from "next";

import { InvoiceEditor } from "@/components/invoices/invoice-editor";
import { listClientOptions } from "@/lib/invoices/queries";
import { todayIsoDate } from "@/lib/invoices/status";
import { getProfile } from "@/lib/profile/queries";

export const metadata: Metadata = {
  title: "New invoice",
};

export default async function NewInvoicePage() {
  const [clients, profile] = await Promise.all([listClientOptions(null), getProfile()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">New invoice</h1>
        <p className="text-sm text-muted-foreground">
          Save it as a draft at any time. Finalize it when it is ready to send.
        </p>
      </div>

      {clients ? (
        <InvoiceEditor
          invoice={null}
          clients={clients}
          sender={profile}
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
