import "server-only";

import { cookies } from "next/headers";

import { requireUser } from "@/lib/auth/queries";
import { clientInvoiceName, type ClientRecord } from "@/lib/clients/types";
import {
  fromHundredths,
  toAmountString,
  toHundredths,
} from "@/lib/invoices/calculations";
import type { InvoiceStatusFilter } from "@/lib/invoices/schemas";
import { getDisplayStatus, todayIsoDate } from "@/lib/invoices/status";
import type {
  InvoiceDetail,
  InvoiceLine,
  InvoiceListItem,
  PartyDetails,
} from "@/lib/invoices/types";
import { createClient } from "@/utils/supabase/server";

export const INVOICES_PER_PAGE = 20;

type SupabaseServerClient = ReturnType<typeof createClient>;

type LiveClient = {
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  address?: string | null;
  vat_id?: string | null;
} | null;

function nameFrom(
  snapshot: { client_company_name: string | null; client_full_name: string | null },
  live: LiveClient,
): string {
  if (snapshot.client_company_name || snapshot.client_full_name) {
    return (snapshot.client_company_name ?? snapshot.client_full_name) as string;
  }
  if (live) {
    return clientInvoiceName(live);
  }
  return "No client yet";
}

/** Strips characters that carry meaning inside a PostgREST `or()` filter. */
function sanitizeSearch(term: string) {
  return term.replace(/[,()*%_\\"'.:]/g, " ").trim().slice(0, 100);
}

async function matchingClientIds(
  supabase: SupabaseServerClient,
  userId: string,
  term: string,
): Promise<string[]> {
  const pattern = `%${term}%`;
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", userId)
    .or(`company_name.ilike.${pattern},full_name.ilike.${pattern}`)
    .limit(200);

  return (data ?? []).map((row) => row.id);
}

export type InvoiceListResult = {
  items: InvoiceListItem[];
  total: number;
  page: number;
  pageCount: number;
};

export async function listInvoices({
  page,
  status,
  search,
}: {
  page: number;
  status: InvoiceStatusFilter;
  search: string;
}): Promise<InvoiceListResult | null> {
  const user = await requireUser();
  const supabase = createClient(await cookies());
  const today = todayIsoDate();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const from = (safePage - 1) * INVOICES_PER_PAGE;

  let query = supabase
    .from("invoices")
    .select(
      "id, invoice_number, invoice_date, due_date, currency, total, status, payment_status, send_count, client_email, client_company_name, client_full_name, clients(full_name, company_name, email)",
      { count: "exact" },
    )
    .eq("user_id", user.id);

  if (status === "draft") {
    query = query.eq("status", "draft");
  } else if (status === "unpaid") {
    query = query.eq("status", "finalized").eq("payment_status", "unpaid");
  } else if (status === "overdue") {
    query = query
      .eq("status", "finalized")
      .eq("payment_status", "unpaid")
      .lt("due_date", today);
  } else if (status === "paid") {
    query = query.eq("payment_status", "paid");
  }

  const term = sanitizeSearch(search);
  if (term) {
    const pattern = `%${term}%`;
    const clientIds = await matchingClientIds(supabase, user.id, term);
    const filters = [
      `invoice_number.ilike.${pattern}`,
      `client_company_name.ilike.${pattern}`,
      `client_full_name.ilike.${pattern}`,
    ];
    if (clientIds.length > 0) {
      filters.push(`client_id.in.(${clientIds.join(",")})`);
    }
    query = query.or(filters.join(","));
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + INVOICES_PER_PAGE - 1);

  if (error || !data) {
    return null;
  }

  const total = count ?? 0;

  return {
    page: safePage,
    total,
    pageCount: Math.max(1, Math.ceil(total / INVOICES_PER_PAGE)),
    items: data.map((row) => {
      const live = row.clients as LiveClient;
      return {
        id: row.id,
        invoice_number: row.invoice_number,
        clientName: nameFrom(row, live),
        invoice_date: row.invoice_date,
        due_date: row.due_date,
        currency: row.currency,
        total: toAmountString(row.total),
        status: row.status as InvoiceListItem["status"],
        payment_status: row.payment_status as InvoiceListItem["payment_status"],
        displayStatus: getDisplayStatus(row),
        hasClientEmail: Boolean(row.client_email ?? live?.email),
        send_count: row.send_count,
      };
    }),
  };
}

function toLines(
  rows: {
    id: string;
    position: number;
    description: string;
    quantity: number;
    unit_type: string;
    unit_price: number;
    line_total: number | null;
  }[],
): InvoiceLine[] {
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map((row) => ({
      id: row.id,
      position: row.position,
      description: row.description,
      quantity: toAmountString(row.quantity),
      unit_type: row.unit_type === "hours" ? "hours" : "flat",
      unit_price: toAmountString(row.unit_price),
      line_total: toAmountString(row.line_total),
    }));
}

export async function getInvoiceDetail(id: string): Promise<InvoiceDetail | null> {
  const user = await requireUser();
  const supabase = createClient(await cookies());

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "*, clients(full_name, company_name, email, address, vat_id), invoice_line_items(id, position, description, quantity, unit_type, unit_price, line_total), invoice_pdfs(id, version, created_at), invoice_sends(id, to_email, subject, status, error_message, payment_link_url, pdf_id, created_at)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !invoice) {
    return null;
  }

  const live = invoice.clients as LiveClient;
  const isDraft = invoice.status === "draft";

  let sender: PartyDetails = {
    full_name: invoice.sender_full_name,
    company_name: invoice.sender_company_name,
    email: invoice.sender_email,
    address: invoice.sender_address,
    vat_id: invoice.sender_vat_id,
    website: invoice.sender_website,
  };

  if (isDraft) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, email, address, vat_id, website")
      .eq("id", user.id)
      .maybeSingle();
    sender = profile ?? sender;
  }

  const client: PartyDetails | null = isDraft
    ? live
      ? {
          full_name: live.full_name,
          company_name: live.company_name,
          email: live.email,
          address: live.address ?? null,
          vat_id: live.vat_id ?? null,
        }
      : null
    : {
        full_name: invoice.client_full_name,
        company_name: invoice.client_company_name,
        email: invoice.client_email,
        address: invoice.client_address,
        vat_id: invoice.client_vat_id,
      };

  const pdfs = [...invoice.invoice_pdfs].sort((a, b) => b.version - a.version);
  const versionById = new Map(pdfs.map((pdf) => [pdf.id, pdf.version]));

  return {
    id: invoice.id,
    status: invoice.status as InvoiceDetail["status"],
    payment_status: invoice.payment_status as InvoiceDetail["payment_status"],
    paid_source: invoice.paid_source as InvoiceDetail["paid_source"],
    paid_at: invoice.paid_at,
    displayStatus: getDisplayStatus(invoice),
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    currency: invoice.currency,
    tax_rate: toAmountString(invoice.tax_rate),
    subtotal: toAmountString(invoice.subtotal),
    tax_amount: toAmountString(invoice.tax_amount),
    total: toAmountString(invoice.total),
    comments: invoice.comments,
    client_id: invoice.client_id,
    clientName: nameFrom(invoice, live),
    sender,
    client,
    lines: toLines(invoice.invoice_line_items),
    pdfs,
    sends: [...invoice.invoice_sends]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((send) => ({
        id: send.id,
        to_email: send.to_email,
        subject: send.subject,
        status: send.status === "sent" ? "sent" : "failed",
        error_message: send.error_message,
        payment_link_url: send.payment_link_url,
        pdf_version: send.pdf_id ? (versionById.get(send.pdf_id) ?? null) : null,
        created_at: send.created_at,
      })),
    send_count: invoice.send_count,
    first_sent_at: invoice.first_sent_at,
    last_sent_at: invoice.last_sent_at,
    stripe_payment_link_url: invoice.stripe_payment_link_url,
    content_version: invoice.content_version,
  };
}

/** Clients offered in the editor: every active client, plus the current one if it was removed. */
export async function listClientOptions(
  currentClientId: string | null,
): Promise<ClientRecord[] | null> {
  const user = await requireUser();
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, company_name, email, address, vat_id, archived_at")
    .eq("user_id", user.id)
    .or(
      currentClientId
        ? `archived_at.is.null,id.eq.${currentClientId}`
        : "archived_at.is.null",
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    return null;
  }

  return data.map((row) => ({
    id: row.id,
    full_name: row.full_name,
    company_name: row.company_name,
    email: row.email,
    address: row.address,
    vat_id: row.vat_id,
    invoiceName: clientInvoiceName(row),
    secondaryName: row.company_name && row.full_name ? row.full_name : null,
  }));
}

export type CurrencyTotals = {
  currency: string;
  paid: string;
  outstanding: string;
  overdue: string;
};

export type DashboardData = {
  totals: CurrencyTotals[];
  invoicesIssued: number;
  clientCount: number;
  recent: InvoiceListItem[];
  profileIncomplete: boolean;
  paymentsReady: boolean;
  paymentsStarted: boolean;
};

export async function getDashboardData(): Promise<DashboardData | null> {
  const user = await requireUser();
  const supabase = createClient(await cookies());
  const today = todayIsoDate();

  const [finalized, clients, recent, profile] = await Promise.all([
    supabase
      .from("invoices")
      .select("currency, total, payment_status, due_date")
      .eq("user_id", user.id)
      .eq("status", "finalized"),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("archived_at", null),
    listInvoices({ page: 1, status: "all", search: "" }),
    supabase
      .from("profiles")
      .select("full_name, company_name, stripe_account_id, stripe_charges_enabled")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (finalized.error || clients.error || !recent || profile.error) {
    return null;
  }

  const byCurrency = new Map<string, { paid: bigint; outstanding: bigint; overdue: bigint }>();
  for (const row of finalized.data ?? []) {
    const bucket = byCurrency.get(row.currency) ?? {
      paid: BigInt(0),
      outstanding: BigInt(0),
      overdue: BigInt(0),
    };
    const cents = toHundredths(row.total) ?? BigInt(0);
    if (row.payment_status === "paid") {
      bucket.paid += cents;
    } else {
      bucket.outstanding += cents;
      if (row.due_date < today) {
        bucket.overdue += cents;
      }
    }
    byCurrency.set(row.currency, bucket);
  }

  const toText = fromHundredths;

  return {
    totals: [...byCurrency.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([currency, bucket]) => ({
        currency,
        paid: toText(bucket.paid),
        outstanding: toText(bucket.outstanding),
        overdue: toText(bucket.overdue),
      })),
    invoicesIssued: finalized.data?.length ?? 0,
    clientCount: clients.count ?? 0,
    recent: recent.items.slice(0, 5),
    profileIncomplete: !profile.data?.full_name && !profile.data?.company_name,
    paymentsReady: Boolean(profile.data?.stripe_charges_enabled),
    paymentsStarted: Boolean(profile.data?.stripe_account_id),
  };
}
