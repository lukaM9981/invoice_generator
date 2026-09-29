"use client";

import { useState } from "react";

import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientSearch } from "@/components/clients/client-search";
import { RemoveClientDialog } from "@/components/clients/remove-client-dialog";
import { Button } from "@/components/ui/button";
import type { ClientRecord } from "@/lib/clients/types";

export function ClientsPanel({
  clients,
  query,
}: {
  clients: ClientRecord[];
  query: string;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [removing, setRemoving] = useState<ClientRecord | null>(null);

  function openCreate() {
    setEditing(null);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  function openEdit(client: ClientRecord) {
    setEditing(client);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-medium">Clients</h1>
          <p className="text-sm text-muted-foreground">
            People and companies you bill.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Add client
        </Button>
      </div>

      <ClientSearch query={query} />

      {clients.length === 0 ? (
        <p className="rounded-xl border px-4 py-8 text-sm text-muted-foreground">
          {query.trim()
            ? "No clients match that search."
            : "You have no clients yet. Add one when you are ready to bill them."}
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {clients.map((client) => (
            <li
              key={client.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{client.invoiceName}</p>
                {client.secondaryName ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {client.secondaryName}
                  </p>
                ) : null}
                {client.email ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {client.email}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openEdit(client)}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setRemoving(client)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ClientFormDialog
        key={formKey}
        open={formOpen}
        client={editing}
        onOpenChange={setFormOpen}
      />
      <RemoveClientDialog
        client={removing}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(null);
          }
        }}
      />
    </div>
  );
}
