"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/queries";
import { sendInvoiceEmail } from "@/lib/email/send-invoice";
import { formatMoney, toAmountString } from "@/lib/invoices/calculations";
import {
  downloadPdf,
  getLatestPdf,
  PDF_BUCKET,
  renderAndStoreInvoicePdf,
} from "@/lib/invoices/pdf/render";
import {
  invoiceDraftSchema,
  invoiceFinalSchema,
  invoiceIdSchema,
  sendInvoiceSchema,
  type InvoiceFormValues,
  type SendInvoiceFormValues,
} from "@/lib/invoices/schemas";
import { formatDate } from "@/lib/invoices/status";
import { isStripeConfigured } from "@/lib/stripe/client";
import {
  createInvoicePaymentLink,
  deactivatePaymentLink,
} from "@/lib/stripe/payment-links";
import { createClient } from "@/utils/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type SaveInvoiceResult =
  | { ok: true; id: string; askToResend: boolean }
  | { ok: false; error: string };

export type SendInvoiceResult =
  | { ok: true; withPaymentLink: boolean }
  | { ok: false; error: string };

const INVALID_INPUT = "Check the form and try again.";
const UNEXPECTED = "Something went wrong. Try again.";
const MISSING_INVOICE = "That invoice no longer exists.";
const PAID_LOCKED = "Paid invoices can't be changed. Mark it as unpaid first.";
const LINK_CANCEL_FAILED =
  "The open payment link couldn't be cancelled, so nothing was changed. Try again.";

type SupabaseServerClient = ReturnType<typeof createClient>;

function revalidateInvoice(id?: string) {
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  if (id) {
    revalidatePath(`/invoices/${id}`);
  }
}

function databaseMessage(error: { message?: string } | null): string {
  const message = error?.message ?? "";
  if (message.includes("paid invoice")) {
    return PAID_LOCKED;
  }
  if (message.includes("no client")) {
    return "Choose who this invoice is for.";
  }
  if (message.includes("no line items")) {
    return "Add at least one row.";
  }
  if (message.includes("already finalized")) {
    return "This invoice is already finalized.";
  }
  if (message.includes("invoices_due_after_issue")) {
    return "The due date can't be before the invoice date.";
  }
  return UNEXPECTED;
}

async function getStripeAccountId(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", userId)
    .maybeSingle();
  return data?.stripe_account_id ?? null;
}

/**
 * Switches off the invoice's open payment link and forgets it, so the next
 * send creates a fresh one. Returns false only when Stripe refused.
 */
async function cancelPaymentLink(
  supabase: SupabaseServerClient,
  userId: string,
  invoice: { id: string; stripe_payment_link_id: string | null },
): Promise<boolean> {
  if (!invoice.stripe_payment_link_id) {
    return true;
  }

  const accountId = await getStripeAccountId(supabase, userId);
  if (accountId && isStripeConfigured()) {
    try {
      await deactivatePaymentLink(accountId, invoice.stripe_payment_link_id);
    } catch {
      return false;
    }
  }

  await supabase
    .from("invoices")
    .update({ stripe_payment_link_id: null, stripe_payment_link_url: null })
    .eq("id", invoice.id)
    .eq("user_id", userId);

  return true;
}

export async function saveInvoice({
  id,
  values,
  finalize,
}: {
  id: string | null;
  values: InvoiceFormValues;
  finalize: boolean;
}): Promise<SaveInvoiceResult> {
  const user = await requireUser();
  const supabase = createClient(await cookies());

  let existing: {
    id: string;
    status: string;
    payment_status: string;
    client_id: string | null;
    total: number;
    currency: string;
    send_count: number;
    stripe_payment_link_id: string | null;
  } | null = null;

  if (id !== null) {
    const parsedId = invoiceIdSchema.safeParse(id);
    if (!parsedId.success) {
      return { ok: false, error: INVALID_INPUT };
    }
    const { data } = await supabase
      .from("invoices")
      .select("id, status, payment_status, client_id, total, currency, send_count, stripe_payment_link_id")
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) {
      return { ok: false, error: MISSING_INVOICE };
    }
    if (data.payment_status === "paid") {
      return { ok: false, error: PAID_LOCKED };
    }
    existing = data;
  }

  const wasFinalized = existing?.status === "finalized";
  const schema = finalize || wasFinalized ? invoiceFinalSchema : invoiceDraftSchema;
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? INVALID_INPUT };
  }
  const input = parsed.data;

  if (input.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("id, archived_at")
      .eq("id", input.client_id)
      .eq("user_id", user.id)
      .maybeSingle();
    const keepsArchived = client?.archived_at && client.id === existing?.client_id;
    if (!client || (client.archived_at && !keepsArchived)) {
      return { ok: false, error: "That client is no longer in your list." };
    }
  }

  const header = {
    client_id: input.client_id,
    invoice_date: input.invoice_date,
    due_date: input.due_date,
    currency: input.currency,
    tax_rate: Number(input.tax_rate),
    comments: input.comments,
  };

  let invoiceId: string;

  if (existing) {
    let snapshot = {};
    if (wasFinalized && input.client_id !== existing.client_id && input.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("full_name, company_name, email, address, vat_id")
        .eq("id", input.client_id)
        .single();
      if (client) {
        snapshot = {
          client_full_name: client.full_name,
          client_company_name: client.company_name,
          client_email: client.email,
          client_address: client.address,
          client_vat_id: client.vat_id,
        };
      }
    }

    const { error } = await supabase
      .from("invoices")
      .update({ ...header, ...snapshot })
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) {
      return { ok: false, error: databaseMessage(error) };
    }
    invoiceId = existing.id;
  } else {
    const { data, error } = await supabase
      .from("invoices")
      .insert({ ...header, user_id: user.id })
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, error: databaseMessage(error) };
    }
    invoiceId = data.id;
  }

  const { error: linesError } = await supabase.rpc("replace_invoice_line_items", {
    p_invoice_id: invoiceId,
    p_items: input.line_items,
  });
  if (linesError) {
    return { ok: false, error: databaseMessage(linesError) };
  }

  if (finalize && !wasFinalized) {
    const { error } = await supabase.rpc("finalize_invoice", { p_invoice_id: invoiceId });
    if (error) {
      revalidateInvoice(invoiceId);
      return { ok: false, error: databaseMessage(error) };
    }
    await renderAndStoreInvoicePdf(supabase, user.id, invoiceId);
  }

  if (wasFinalized && existing) {
    const { data: saved } = await supabase
      .from("invoices")
      .select("total, currency")
      .eq("id", invoiceId)
      .single();

    const amountChanged =
      !saved ||
      toAmountString(saved.total) !== toAmountString(existing.total) ||
      saved.currency !== existing.currency;

    if (amountChanged) {
      await cancelPaymentLink(supabase, user.id, existing);
    }

    await renderAndStoreInvoicePdf(supabase, user.id, invoiceId);
  }

  revalidateInvoice(invoiceId);
  return {
    ok: true,
    id: invoiceId,
    askToResend: wasFinalized && (existing?.send_count ?? 0) > 0,
  };
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsedId = invoiceIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const supabase = createClient(await cookies());
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, payment_status, stripe_payment_link_id, invoice_pdfs(storage_path)")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!invoice) {
    return { ok: false, error: MISSING_INVOICE };
  }
  if (invoice.payment_status === "paid") {
    return { ok: false, error: "Paid invoices can't be deleted." };
  }
  if (!(await cancelPaymentLink(supabase, user.id, invoice))) {
    return { ok: false, error: LINK_CANCEL_FAILED };
  }

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoice.id)
    .eq("user_id", user.id);
  if (error) {
    return { ok: false, error: UNEXPECTED };
  }

  const paths = invoice.invoice_pdfs.map((pdf) => pdf.storage_path);
  if (paths.length > 0) {
    await supabase.storage.from(PDF_BUCKET).remove(paths);
  }

  revalidateInvoice();
  return { ok: true };
}

export async function markInvoicePaid(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsedId = invoiceIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const supabase = createClient(await cookies());
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, payment_status, stripe_payment_link_id")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!invoice) {
    return { ok: false, error: MISSING_INVOICE };
  }
  if (invoice.status !== "finalized") {
    return { ok: false, error: "Finalize the invoice before marking it as paid." };
  }
  if (invoice.payment_status === "paid") {
    return { ok: true };
  }
  if (!(await cancelPaymentLink(supabase, user.id, invoice))) {
    return { ok: false, error: LINK_CANCEL_FAILED };
  }

  const { error } = await supabase
    .from("invoices")
    .update({
      payment_status: "paid",
      paid_source: "manual",
      paid_at: new Date().toISOString(),
    })
    .eq("id", invoice.id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: UNEXPECTED };
  }

  revalidateInvoice(invoice.id);
  return { ok: true };
}

export async function markInvoiceUnpaid(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsedId = invoiceIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("invoices")
    .update({
      payment_status: "unpaid",
      paid_source: null,
      paid_at: null,
      stripe_checkout_session_id: null,
    })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .eq("payment_status", "paid")
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: UNEXPECTED };
  }
  if (!data) {
    return { ok: false, error: MISSING_INVOICE };
  }

  revalidateInvoice(data.id);
  return { ok: true };
}

export async function sendInvoice(
  id: string,
  values: SendInvoiceFormValues,
): Promise<SendInvoiceResult> {
  const user = await requireUser();
  const parsedId = invoiceIdSchema.safeParse(id);
  const parsed = sendInvoiceSchema.safeParse(values);
  if (!parsedId.success || !parsed.success) {
    return {
      ok: false,
      error: parsed.success ? INVALID_INPUT : (parsed.error.issues[0]?.message ?? INVALID_INPUT),
    };
  }
  const message = parsed.data;

  const supabase = createClient(await cookies());
  const [{ data: invoice }, { data: profile }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("email, full_name, company_name, stripe_account_id, stripe_charges_enabled")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!invoice) {
    return { ok: false, error: MISSING_INVOICE };
  }
  if (invoice.status !== "finalized" || !invoice.invoice_number) {
    return { ok: false, error: "Finalize the invoice before sending it." };
  }

  const isUnpaid = invoice.payment_status === "unpaid";

  if (!invoice.client_email && isUnpaid) {
    await supabase
      .from("invoices")
      .update({ client_email: message.to_email })
      .eq("id", invoice.id)
      .eq("user_id", user.id);
    if (invoice.client_id) {
      await supabase
        .from("clients")
        .update({ email: message.to_email })
        .eq("id", invoice.client_id)
        .eq("user_id", user.id)
        .is("email", null)
        .is("archived_at", null);
    }
  }

  async function recordFailure(error: string, pdfId: string | null, linkUrl: string | null) {
    await supabase.from("invoice_sends").insert({
      invoice_id: invoice!.id,
      user_id: user.id,
      pdf_id: pdfId,
      to_email: message.to_email,
      subject: message.subject,
      body: message.body,
      payment_link_url: linkUrl,
      status: "failed",
      error_message: error.slice(0, 1000),
    });
    revalidateInvoice(invoice!.id);
    return { ok: false as const, error };
  }

  let paymentUrl = isUnpaid ? invoice.stripe_payment_link_url : null;
  const canCharge =
    isUnpaid &&
    Boolean(profile?.stripe_charges_enabled && profile.stripe_account_id) &&
    isStripeConfigured();

  if (canCharge && !paymentUrl) {
    try {
      const link = await createInvoicePaymentLink({
        accountId: profile!.stripe_account_id!,
        invoiceId: invoice.id,
        userId: user.id,
        invoiceNumber: invoice.invoice_number,
        currency: invoice.currency,
        total: toAmountString(invoice.total),
        generation: `v${invoice.content_version}-${new Date(invoice.updated_at).getTime()}`,
      });
      const { error } = await supabase
        .from("invoices")
        .update({ stripe_payment_link_id: link.id, stripe_payment_link_url: link.url })
        .eq("id", invoice.id)
        .eq("user_id", user.id);
      if (error) {
        return recordFailure("The payment link couldn't be saved. Try again.", null, null);
      }
      paymentUrl = link.url;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      return recordFailure(`The payment link couldn't be created: ${reason}`, null, null);
    }
  }

  let pdf = await getLatestPdf(supabase, invoice.id);
  pdf ??= await renderAndStoreInvoicePdf(supabase, user.id, invoice.id);
  const buffer = pdf ? await downloadPdf(supabase, pdf.storage_path) : null;
  if (!pdf || !buffer) {
    return recordFailure("The invoice PDF couldn't be prepared. Try again.", pdf?.id ?? null, paymentUrl);
  }

  const senderName =
    invoice.sender_company_name ??
    invoice.sender_full_name ??
    profile?.company_name ??
    profile?.full_name ??
    user.email ??
    "Invoice Generator";

  const result = await sendInvoiceEmail({
    to: message.to_email,
    replyTo: profile?.email ?? user.email,
    subject: message.subject,
    pdf: buffer,
    filename: `${invoice.invoice_number}.pdf`,
    senderName,
    message: message.body,
    invoiceNumber: invoice.invoice_number,
    total: formatMoney(toAmountString(invoice.total), invoice.currency),
    dueDate: formatDate(invoice.due_date),
    paymentUrl,
  });

  if (!result.ok) {
    return recordFailure(result.error, pdf.id, paymentUrl);
  }

  const now = new Date().toISOString();
  await supabase.from("invoice_sends").insert({
    invoice_id: invoice.id,
    user_id: user.id,
    pdf_id: pdf.id,
    to_email: message.to_email,
    subject: message.subject,
    body: message.body,
    payment_link_url: paymentUrl,
    status: "sent",
    provider_message_id: result.messageId,
  });
  await supabase
    .from("invoices")
    .update({
      send_count: invoice.send_count + 1,
      first_sent_at: invoice.first_sent_at ?? now,
      last_sent_at: now,
    })
    .eq("id", invoice.id)
    .eq("user_id", user.id);

  revalidateInvoice(invoice.id);
  return { ok: true, withPaymentLink: Boolean(paymentUrl) };
}
