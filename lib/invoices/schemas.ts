import { z } from "zod";

import { lineTotalHundredths, toHundredths } from "@/lib/invoices/calculations";

export const CURRENCIES = ["EUR", "USD", "GBP", "CHF"] as const;
export const UNIT_TYPES = ["hours", "flat"] as const;
export const MAX_LINE_ITEMS = 100;

export type Currency = (typeof CURRENCIES)[number];
export type UnitType = (typeof UNIT_TYPES)[number];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function dateField(label: string) {
  return z
    .string()
    .trim()
    .refine(isRealDate, { error: `Enter a valid ${label}.` });
}

function decimalField({
  label,
  maxWholeDigits,
  allowZero,
}: {
  label: string;
  maxWholeDigits: number;
  allowZero: boolean;
}) {
  const pattern = new RegExp(`^\\d{1,${maxWholeDigits}}(\\.\\d{1,2})?$`);
  return z
    .string()
    .trim()
    .refine((value) => pattern.test(value), {
      error: `Enter ${label} with at most two decimals.`,
    })
    .refine(
      (value) => {
        const hundredths = toHundredths(value);
        return hundredths !== null && (allowZero || hundredths > BigInt(0));
      },
      { error: allowZero ? `Enter ${label}.` : `${label[0].toUpperCase()}${label.slice(1)} must be more than zero.` },
    );
}

export const lineItemSchema = z.object({
  description: z
    .string()
    .trim()
    .max(500, { error: "Description is too long." }),
  quantity: decimalField({ label: "a quantity", maxWholeDigits: 10, allowZero: false }),
  unit_type: z.enum(UNIT_TYPES, { error: "Choose hours or flat." }),
  unit_price: decimalField({ label: "a price", maxWholeDigits: 12, allowZero: true }),
});

const invoiceObject = z.object({
  client_id: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || z.uuid().safeParse(value).success, {
      error: "Choose a client from the list.",
    })
    .transform((value) => (value.length === 0 ? null : value)),
  invoice_date: dateField("invoice date"),
  due_date: dateField("due date"),
  currency: z.enum(CURRENCIES, { error: "Choose a currency." }),
  tax_rate: z
    .string()
    .trim()
    .refine((value) => /^\d{1,3}(\.\d{1,2})?$/.test(value), {
      error: "Enter a tax rate between 0 and 100.",
    })
    .refine((value) => (toHundredths(value) ?? BigInt(0)) <= BigInt(10000), {
      error: "Enter a tax rate between 0 and 100.",
    }),
  comments: z
    .string()
    .trim()
    .max(2000, { error: "Comments are too long." })
    .transform((value) => (value.length === 0 ? null : value)),
  line_items: z
    .array(lineItemSchema)
    .max(MAX_LINE_ITEMS, { error: `An invoice can have at most ${MAX_LINE_ITEMS} rows.` }),
});

function checkDueDate(
  value: { invoice_date: string; due_date: string },
  context: z.RefinementCtx,
) {
  if (value.due_date < value.invoice_date) {
    context.addIssue({
      code: "custom",
      message: "The due date can't be before the invoice date.",
      path: ["due_date"],
    });
  }
}

/** Drafts store almost anything; the database constraints are the only hard rules. */
export const invoiceDraftSchema = invoiceObject.superRefine(checkDueDate);

/** A finalized invoice is a real document, so it must be complete. */
export const invoiceFinalSchema = invoiceObject.superRefine((value, context) => {
  checkDueDate(value, context);

  if (!value.client_id) {
    context.addIssue({
      code: "custom",
      message: "Choose who this invoice is for.",
      path: ["client_id"],
    });
  }

  if (value.line_items.length === 0) {
    context.addIssue({
      code: "custom",
      message: "Add at least one row.",
      path: ["line_items"],
    });
  }

  value.line_items.forEach((line, index) => {
    if (line.description.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Describe what this row is for.",
        path: ["line_items", index, "description"],
      });
    }
  });

  const hasPositiveLine = value.line_items.some(
    (line) =>
      line.description.length > 0 &&
      lineTotalHundredths(line.quantity, line.unit_price) > BigInt(0),
  );

  if (value.line_items.length > 0 && !hasPositiveLine) {
    context.addIssue({
      code: "custom",
      message: "At least one row needs a price above zero.",
      path: ["line_items"],
    });
  }
});

export type InvoiceFormValues = z.input<typeof invoiceObject>;
export type InvoiceValues = z.output<typeof invoiceObject>;
export type LineItemFormValues = z.input<typeof lineItemSchema>;

export const invoiceIdSchema = z.uuid();

export const sendInvoiceSchema = z.object({
  to_email: z
    .string()
    .trim()
    .min(1, { error: "Enter the client's email address." })
    .max(254, { error: "Email address is too long." })
    .pipe(z.email({ error: "Enter a valid email address." })),
  subject: z
    .string()
    .trim()
    .min(1, { error: "Enter a subject." })
    .max(200, { error: "Subject is too long." }),
  body: z
    .string()
    .trim()
    .min(1, { error: "Enter a message." })
    .max(5000, { error: "Message is too long." }),
});

export type SendInvoiceFormValues = z.input<typeof sendInvoiceSchema>;

export const INVOICE_STATUS_FILTERS = ["all", "draft", "unpaid", "overdue", "paid"] as const;
export type InvoiceStatusFilter = (typeof INVOICE_STATUS_FILTERS)[number];

export function parseStatusFilter(value: unknown): InvoiceStatusFilter {
  return INVOICE_STATUS_FILTERS.includes(value as InvoiceStatusFilter)
    ? (value as InvoiceStatusFilter)
    : "all";
}
