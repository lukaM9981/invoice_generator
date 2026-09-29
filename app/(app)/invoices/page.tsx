import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices",
};

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-2xl font-medium">Invoices</h1>
      <p className="text-sm text-muted-foreground">
        Invoice management will appear here in the next milestone.
      </p>
    </div>
  );
}
