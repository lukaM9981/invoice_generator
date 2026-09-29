import type { Metadata } from "next";

import { ClientsPanel } from "@/components/clients/clients-panel";
import { listClients } from "@/lib/clients/queries";

export const metadata: Metadata = {
  title: "Clients",
};

export default async function ClientsPage({
  searchParams,
}: PageProps<"/clients">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const clients = await listClients(query);

  if (!clients) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Clients</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your clients. Refresh the page and try again.
        </p>
      </div>
    );
  }

  return <ClientsPanel clients={clients} query={query} />;
}
