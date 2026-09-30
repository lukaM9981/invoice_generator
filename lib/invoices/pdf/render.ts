import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import { toAmountString } from "@/lib/invoices/calculations";
import { InvoiceDocument, type InvoicePdfData } from "@/lib/invoices/pdf/InvoiceDocument";
import type { InvoiceLine } from "@/lib/invoices/types";
import type { createClient } from "@/utils/supabase/server";

export const PDF_BUCKET = "invoice-pdfs";

type SupabaseServerClient = ReturnType<typeof createClient>;

export type StoredPdf = {
  id: string;
  version: number;
  storage_path: string;
};

async function loadPdfData(
  supabase: SupabaseServerClient,
  invoiceId: string,
): Promise<InvoicePdfData | null> {
  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "*, invoice_line_items(id, position, description, quantity, unit_type, unit_price, line_total)",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice || invoice.status !== "finalized" || !invoice.invoice_number) {
    return null;
  }

  const lines: InvoiceLine[] = [...invoice.invoice_line_items]
    .sort((a, b) => a.position - b.position)
    .map((line) => ({
      id: line.id,
      position: line.position,
      description: line.description,
      quantity: toAmountString(line.quantity),
      unit_type: line.unit_type === "hours" ? "hours" : "flat",
      unit_price: toAmountString(line.unit_price),
      line_total: toAmountString(line.line_total),
    }));

  return {
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    currency: invoice.currency,
    tax_rate: toAmountString(invoice.tax_rate),
    subtotal: toAmountString(invoice.subtotal),
    tax_amount: toAmountString(invoice.tax_amount),
    total: toAmountString(invoice.total),
    comments: invoice.comments,
    sender: {
      full_name: invoice.sender_full_name,
      company_name: invoice.sender_company_name,
      email: invoice.sender_email,
      address: invoice.sender_address,
      vat_id: invoice.sender_vat_id,
      website: invoice.sender_website,
    },
    client: {
      full_name: invoice.client_full_name,
      company_name: invoice.client_company_name,
      email: invoice.client_email,
      address: invoice.client_address,
      vat_id: invoice.client_vat_id,
    },
    lines,
  };
}

/**
 * Renders the invoice as it is now and stores it as the next version.
 * Versions are never overwritten, so every PDF a client received stays available.
 */
export async function renderAndStoreInvoicePdf(
  supabase: SupabaseServerClient,
  userId: string,
  invoiceId: string,
): Promise<StoredPdf | null> {
  const data = await loadPdfData(supabase, invoiceId);
  if (!data) {
    return null;
  }

  const buffer = await renderToBuffer(InvoiceDocument({ data }));

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data: latest } = await supabase
      .from("invoice_pdfs")
      .select("version")
      .eq("invoice_id", invoiceId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const version = (latest?.version ?? 0) + 1;
    const storagePath = `${userId}/${invoiceId}/v${version}.pdf`;

    const upload = await supabase.storage
      .from(PDF_BUCKET)
      .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

    if (upload.error) {
      continue;
    }

    const { data: row, error } = await supabase
      .from("invoice_pdfs")
      .insert({
        invoice_id: invoiceId,
        user_id: userId,
        version,
        storage_path: storagePath,
        byte_size: buffer.byteLength,
      })
      .select("id, version, storage_path")
      .single();

    if (!error && row) {
      return row;
    }
  }

  return null;
}

export async function getLatestPdf(
  supabase: SupabaseServerClient,
  invoiceId: string,
): Promise<StoredPdf | null> {
  const { data } = await supabase
    .from("invoice_pdfs")
    .select("id, version, storage_path")
    .eq("invoice_id", invoiceId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function downloadPdf(
  supabase: SupabaseServerClient,
  storagePath: string,
): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(PDF_BUCKET).download(storagePath);
  if (error || !data) {
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}
