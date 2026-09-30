import type { Metadata } from "next";
import Link from "next/link";

import { InvoiceTable } from "@/components/invoices/invoice-table";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/invoices/calculations";
import { getDashboardData } from "@/lib/invoices/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

function MoneyFigure({
  label,
  values,
}: {
  label: string;
  values: { currency: string; amount: string }[];
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="flex flex-col gap-0.5 text-xl tabular-nums">
          {values.length === 0 ? (
            <span>{formatMoney("0", "EUR")}</span>
          ) : (
            values.map((value) => (
              <span key={value.currency}>{formatMoney(value.amount, value.currency)}</span>
            ))
          )}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function CountFigure({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your figures. Refresh the page and try again.
        </p>
      </div>
    );
  }

  const pick = (key: "paid" | "outstanding" | "overdue") =>
    data.totals.map((row) => ({ currency: row.currency, amount: row[key] }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-medium">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Where your invoices stand today.</p>
        </div>
        <Link href="/invoices/new" className={buttonVariants()}>
          New invoice
        </Link>
      </div>

      {data.profileIncomplete || !data.paymentsReady ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.profileIncomplete ? (
            <Card>
              <CardHeader>
                <CardTitle>Add your details</CardTitle>
                <CardDescription>
                  Your name or company is printed in the From block of every invoice.
                </CardDescription>
                <CardAction>
                  <Link href="/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Open settings
                  </Link>
                </CardAction>
              </CardHeader>
            </Card>
          ) : null}
          {!data.paymentsReady ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {data.paymentsStarted ? "Finish Stripe onboarding" : "Accept online payments"}
                </CardTitle>
                <CardDescription>
                  Until Stripe is connected, invoices are sent without a payment link.
                </CardDescription>
                <CardAction>
                  <Link href="/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    {data.paymentsStarted ? "Continue" : "Connect"}
                  </Link>
                </CardAction>
              </CardHeader>
            </Card>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MoneyFigure label="Paid" values={pick("paid")} />
        <MoneyFigure label="Outstanding" values={pick("outstanding")} />
        <MoneyFigure label="Overdue" values={pick("overdue")} />
        <CountFigure label="Clients" value={data.clientCount} />
        <CountFigure label="Invoices issued" value={data.invoicesIssued} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent invoices</CardTitle>
          <CardAction>
            <Link href="/invoices" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invoices yet.{" "}
              <Link href="/invoices/new" className="underline underline-offset-4">
                Create your first one
              </Link>
              .
            </p>
          ) : (
            <InvoiceTable items={data.recent} showActions={false} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
