"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { ClientSelect } from "@/components/invoices/client-select";
import { EMPTY_LINE, LineItemsTable } from "@/components/invoices/line-items-table";
import { ResendConfirmDialog } from "@/components/invoices/resend-confirm-dialog";
import { TotalsSummary } from "@/components/invoices/totals-summary";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClientRecord } from "@/lib/clients/types";
import { saveInvoice } from "@/lib/invoices/actions";
import { calculateTotals } from "@/lib/invoices/calculations";
import {
  CURRENCIES,
  invoiceDraftSchema,
  invoiceFinalSchema,
  type InvoiceFormValues,
} from "@/lib/invoices/schemas";
import { addDays } from "@/lib/invoices/status";
import type { InvoiceDetail, PartyDetails } from "@/lib/invoices/types";

const CURRENCY_ITEMS = CURRENCIES.map((currency) => ({ value: currency, label: currency }));

function toFormValues(invoice: InvoiceDetail | null, today: string): InvoiceFormValues {
  if (!invoice) {
    return {
      client_id: "",
      invoice_date: today,
      due_date: addDays(today, 14),
      currency: "EUR",
      tax_rate: "0",
      comments: "",
      line_items: [{ ...EMPTY_LINE }],
    };
  }

  return {
    client_id: invoice.client_id ?? "",
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    currency: invoice.currency as InvoiceFormValues["currency"],
    tax_rate: invoice.tax_rate,
    comments: invoice.comments ?? "",
    line_items: invoice.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unit_type: line.unit_type,
      unit_price: line.unit_price,
    })),
  };
}

function PartyPreview({ party }: { party: PartyDetails | null }) {
  if (!party || !(party.company_name || party.full_name)) {
    return null;
  }
  return (
    <div className="text-sm text-muted-foreground">
      {party.company_name && party.full_name ? <p>{party.full_name}</p> : null}
      {party.address ? <p className="whitespace-pre-line">{party.address}</p> : null}
      {party.email ? <p>{party.email}</p> : null}
      {party.vat_id ? <p>VAT ID: {party.vat_id}</p> : null}
    </div>
  );
}

export function InvoiceEditor({
  invoice,
  clients: initialClients,
  sender,
  today,
}: {
  invoice: InvoiceDetail | null;
  clients: ClientRecord[];
  sender: PartyDetails | null;
  today: string;
}) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [pending, setPending] = useState<"draft" | "finalize" | null>(null);
  const [resendFor, setResendFor] = useState<string | null>(null);

  const form = useForm<InvoiceFormValues>({
    defaultValues: toFormValues(invoice, today),
  });
  const { errors } = form.formState;

  const isFinalized = invoice?.status === "finalized";
  const [lines, taxRate, currency, clientId] = useWatch({
    control: form.control,
    name: ["line_items", "tax_rate", "currency", "client_id"],
  });
  const totals = calculateTotals(
    (lines ?? []).map((line) => ({
      quantity: line.quantity ?? "0",
      unit_price: line.unit_price ?? "0",
    })),
    taxRate ?? "0",
  );
  const selectedClient = clients.find((client) => client.id === clientId) ?? null;

  function applyIssues(issues: { path: PropertyKey[]; message: string }[]) {
    form.clearErrors();
    for (const issue of issues) {
      const path = issue.path.map(String).join(".");
      const name = (path === "line_items" ? "line_items.root" : path) as FieldPath<InvoiceFormValues>;
      if (!form.getFieldState(name).error) {
        form.setError(name, { message: issue.message });
      }
    }
  }

  async function submit(finalize: boolean) {
    const values = form.getValues();
    const schema = finalize || isFinalized ? invoiceFinalSchema : invoiceDraftSchema;
    const parsed = schema.safeParse(values);

    if (!parsed.success) {
      applyIssues(parsed.error.issues);
      toast.error(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    form.clearErrors();

    setPending(finalize ? "finalize" : "draft");
    const result = await saveInvoice({ id: invoice?.id ?? null, values, finalize });
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    if (result.askToResend) {
      toast.success("Invoice saved.");
      setResendFor(result.id);
      return;
    }

    if (finalize) {
      toast.success("Invoice finalized. It's ready to send.");
      router.push(`/invoices/${result.id}`);
    } else if (isFinalized) {
      toast.success("Invoice saved.");
      router.push(`/invoices/${result.id}`);
    } else {
      toast.success("Draft saved.");
      if (!invoice) {
        router.replace(`/invoices/${result.id}/edit`);
      }
      router.refresh();
    }
  }

  const busy = pending !== null;

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit(false);
      }}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>From</CardTitle>
            <CardDescription>
              {isFinalized
                ? "Frozen when the invoice was finalized."
                : "Taken from your settings when you finalize."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="font-medium">
              {sender?.company_name ?? sender?.full_name ?? "Your details are empty"}
            </p>
            <PartyPreview party={sender} />
            {!isFinalized ? (
              <Link href="/settings" className="mt-2 text-sm underline underline-offset-4">
                Change your details
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>To</CardTitle>
            <CardDescription>The client this invoice is for.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field data-invalid={Boolean(errors.client_id)}>
              <FieldLabel htmlFor="invoice-client">Client</FieldLabel>
              <Controller
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <ClientSelect
                    id="invoice-client"
                    clients={clients}
                    value={field.value}
                    invalid={Boolean(errors.client_id)}
                    onChange={field.onChange}
                    onClientCreated={(client) => setClients((list) => [client, ...list])}
                  />
                )}
              />
              <FieldError errors={[errors.client_id]} />
              {selectedClient && !selectedClient.email ? (
                <FieldDescription>
                  This client has no email address. You can add one when you send.
                </FieldDescription>
              ) : null}
            </Field>
            {!isFinalized ? (
              <div className="mt-3">
                <PartyPreview party={selectedClient} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          {invoice?.invoice_number ? (
            <CardDescription>Invoice {invoice.invoice_number}</CardDescription>
          ) : (
            <CardDescription>The invoice number is assigned when you finalize.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field data-invalid={Boolean(errors.invoice_date)}>
              <FieldLabel htmlFor="invoice-date">Invoice date</FieldLabel>
              <Input
                id="invoice-date"
                type="date"
                aria-invalid={Boolean(errors.invoice_date)}
                {...form.register("invoice_date", {
                  onChange: (event) => {
                    const value = event.target.value as string;
                    if (value && !form.getFieldState("due_date").isDirty) {
                      form.setValue("due_date", addDays(value, 14));
                    }
                  },
                })}
              />
              <FieldError errors={[errors.invoice_date]} />
            </Field>

            <Field data-invalid={Boolean(errors.due_date)}>
              <FieldLabel htmlFor="due-date">Due date</FieldLabel>
              <Input
                id="due-date"
                type="date"
                aria-invalid={Boolean(errors.due_date)}
                {...form.register("due_date")}
              />
              <FieldError errors={[errors.due_date]} />
            </Field>

            <Field data-invalid={Boolean(errors.currency)}>
              <FieldLabel htmlFor="invoice-currency">Currency</FieldLabel>
              <Controller
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <Select
                    items={CURRENCY_ITEMS}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "EUR")}
                  >
                    <SelectTrigger id="invoice-currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.currency]} />
            </Field>

            <Field data-invalid={Boolean(errors.tax_rate)}>
              <FieldLabel htmlFor="tax-rate">Tax rate (%)</FieldLabel>
              <Input
                id="tax-rate"
                inputMode="decimal"
                aria-invalid={Boolean(errors.tax_rate)}
                {...form.register("tax_rate")}
              />
              <FieldError errors={[errors.tax_rate]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <CardDescription>Amounts are calculated for you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <LineItemsTable form={form} disabled={busy} />
          <TotalsSummary totals={totals} currency={currency} taxRate={taxRate ?? "0"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>Printed at the bottom of the invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field data-invalid={Boolean(errors.comments)}>
            <FieldLabel htmlFor="invoice-comments" className="sr-only">
              Comments
            </FieldLabel>
            <Textarea
              id="invoice-comments"
              rows={3}
              aria-invalid={Boolean(errors.comments)}
              {...form.register("comments")}
            />
            <FieldError errors={[errors.comments]} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={invoice ? `/invoices/${invoice.id}` : "/invoices"}
          className={buttonVariants({ variant: "ghost" })}
        >
          Cancel
        </Link>
        {isFinalized ? (
          <Button type="submit" disabled={busy}>
            {pending ? "Saving…" : "Save"}
          </Button>
        ) : (
          <>
            <Button type="submit" variant="outline" disabled={busy}>
              {pending === "draft" ? "Saving…" : "Save draft"}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void submit(true)}>
              {pending === "finalize" ? "Finalizing…" : "Finalize"}
            </Button>
          </>
        )}
      </div>

      <ResendConfirmDialog
        open={resendFor !== null}
        onSkip={() => {
          const id = resendFor;
          setResendFor(null);
          if (id) {
            router.push(`/invoices/${id}`);
          }
        }}
        onResend={() => {
          const id = resendFor;
          setResendFor(null);
          if (id) {
            router.push(`/invoices/${id}?send=1`);
          }
        }}
      />
    </form>
  );
}
