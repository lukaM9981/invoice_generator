import type { DisplayStatus } from "@/lib/invoices/status";

export type PartyDetails = {
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  address: string | null;
  vat_id: string | null;
  website?: string | null;
};

export type InvoiceLine = {
  id: string;
  position: number;
  description: string;
  quantity: string;
  unit_type: "hours" | "flat";
  unit_price: string;
  line_total: string;
};

export type InvoicePdfVersion = {
  id: string;
  version: number;
  created_at: string;
};

export type InvoiceSendRecord = {
  id: string;
  to_email: string;
  subject: string;
  status: "sent" | "failed";
  error_message: string | null;
  payment_link_url: string | null;
  pdf_version: number | null;
  created_at: string;
};

export type InvoiceDetail = {
  id: string;
  status: "draft" | "finalized";
  payment_status: "unpaid" | "paid";
  paid_source: "stripe" | "manual" | null;
  paid_at: string | null;
  displayStatus: DisplayStatus;
  invoice_number: string | null;
  invoice_date: string;
  due_date: string;
  currency: string;
  tax_rate: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  comments: string | null;
  client_id: string | null;
  clientName: string;
  sender: PartyDetails;
  client: PartyDetails | null;
  lines: InvoiceLine[];
  pdfs: InvoicePdfVersion[];
  sends: InvoiceSendRecord[];
  send_count: number;
  first_sent_at: string | null;
  last_sent_at: string | null;
  stripe_payment_link_url: string | null;
  content_version: number;
};

export type InvoiceListItem = {
  id: string;
  invoice_number: string | null;
  clientName: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  total: string;
  status: "draft" | "finalized";
  payment_status: "unpaid" | "paid";
  displayStatus: DisplayStatus;
  hasClientEmail: boolean;
  send_count: number;
};
