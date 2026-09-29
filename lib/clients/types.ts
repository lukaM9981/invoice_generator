export type ClientRecord = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  address: string | null;
  vat_id: string | null;
  invoiceName: string;
  secondaryName: string | null;
};

export function clientInvoiceName(client: {
  company_name: string | null;
  full_name: string | null;
}): string {
  return client.company_name ?? client.full_name ?? "Unnamed client";
}
