"use client";

import { useState } from "react";
import { RiAddLine } from "@remixicon/react";

import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientRecord } from "@/lib/clients/types";

const ADD_CLIENT = "__add_client__";

export function ClientSelect({
  id,
  clients,
  value,
  invalid,
  onChange,
  onClientCreated,
}: {
  id: string;
  clients: ClientRecord[];
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
  onClientCreated: (client: ClientRecord) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  const items = [
    ...clients.map((client) => ({ value: client.id, label: client.invoiceName })),
    { value: ADD_CLIENT, label: "Add client" },
  ];

  return (
    <>
      <Select
        items={items}
        value={value || null}
        onValueChange={(next) => {
          if (next === ADD_CLIENT) {
            setDialogKey((key) => key + 1);
            setDialogOpen(true);
            return;
          }
          onChange(typeof next === "string" ? next : "");
        }}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
          <SelectValue placeholder="Choose a client" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <span className="truncate">{client.invoiceName}</span>
              {client.email ? (
                <span className="truncate text-muted-foreground">{client.email}</span>
              ) : null}
            </SelectItem>
          ))}
          {clients.length > 0 ? <SelectSeparator /> : null}
          <SelectItem value={ADD_CLIENT}>
            <RiAddLine aria-hidden="true" />
            Add client
          </SelectItem>
        </SelectContent>
      </Select>

      <ClientFormDialog
        key={dialogKey}
        open={dialogOpen}
        client={null}
        onOpenChange={setDialogOpen}
        onCreated={(client) => {
          onClientCreated(client);
          onChange(client.id);
        }}
      />
    </>
  );
}
