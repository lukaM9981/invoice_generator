import "server-only";

import { cookies } from "next/headers";

import { requireUser } from "@/lib/auth/queries";
import { clientInvoiceName, type ClientRecord } from "@/lib/clients/types";
import { createClient } from "@/utils/supabase/server";

const CLIENT_COLUMNS =
  "id, full_name, company_name, email, address, vat_id" as const;

export type { ClientRecord };

type ClientRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  address: string | null;
  vat_id: string | null;
};

function toClientRecord(row: ClientRow): ClientRecord {
  return {
    ...row,
    invoiceName: clientInvoiceName(row),
    secondaryName:
      row.company_name && row.full_name ? row.full_name : null,
  };
}

function matchesSearch(row: ClientRow, term: string) {
  const needle = term.toLowerCase();
  return [row.full_name, row.company_name, row.email].some((value) =>
    value?.toLowerCase().includes(needle),
  );
}

export async function listClients(search: string): Promise<ClientRecord[] | null> {
  const user = await requireUser();
  const supabase = createClient(await cookies());
  const term = search.trim().slice(0, 100);

  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_COLUMNS)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return null;
  }

  const rows = term ? data.filter((row) => matchesSearch(row, term)) : data;
  return rows.map(toClientRecord);
}
