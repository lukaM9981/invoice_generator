"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { archiveClient } from "@/lib/clients/actions";
import type { ClientRecord } from "@/lib/clients/types";

export function RemoveClientDialog({
  client,
  onOpenChange,
}: {
  client: ClientRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [shown, setShown] = useState(client);

  if (client && client !== shown) {
    setShown(client);
  }

  async function onConfirm() {
    if (!client || pending) {
      return;
    }

    setPending(true);
    const result = await archiveClient(client.id);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Client removed.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <AlertDialog
      open={client !== null}
      onOpenChange={(open) => {
        if (!pending) {
          onOpenChange(open);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this client?</AlertDialogTitle>
          <AlertDialogDescription>
            {shown?.invoiceName ?? "This client"} will disappear from your
            list and cannot be brought back. Invoices you already finished keep
            the details that were on them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Removing…" : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
