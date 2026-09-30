"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createClientRecord,
  updateClientRecord,
} from "@/lib/clients/actions";
import { clientInvoiceName, type ClientRecord } from "@/lib/clients/types";
import {
  clientSchema,
  DUPLICATE_CLIENT_EMAIL,
  type ClientFormValues,
} from "@/lib/clients/schemas";

function toFormValues(client: ClientRecord | null): ClientFormValues {
  return {
    full_name: client?.full_name ?? "",
    company_name: client?.company_name ?? "",
    email: client?.email ?? "",
    address: client?.address ?? "",
    vat_id: client?.vat_id ?? "",
  };
}

export function ClientFormDialog({
  open,
  client,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  client: ClientRecord | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (client: ClientRecord) => void;
}) {
  const router = useRouter();
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema, undefined, { raw: true }),
    defaultValues: toFormValues(client),
  });

  const { errors, isSubmitting } = form.formState;
  const editing = client !== null;

  async function onSubmit(values: ClientFormValues) {
    const result = editing
      ? await updateClientRecord(client.id, values)
      : await createClientRecord(values);

    if (!result.ok) {
      if (result.error === DUPLICATE_CLIENT_EMAIL) {
        form.setError("email", { message: result.error });
      }
      toast.error(result.error);
      return;
    }

    toast.success("Client saved.");
    if (!editing && onCreated && "id" in result && typeof result.id === "string") {
      const saved = clientSchema.parse(values);
      onCreated({
        id: result.id,
        ...saved,
        invoiceName: clientInvoiceName(saved),
        secondaryName: saved.company_name && saved.full_name ? saved.full_name : null,
      });
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="pr-8">
          <DialogTitle>{editing ? "Change client" : "Add client"}</DialogTitle>
          <DialogDescription>
            These details are saved for when you add this client to an invoice.
          </DialogDescription>
        </DialogHeader>
        <form className="contents" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.full_name)}>
              <FieldLabel htmlFor="client-full-name">Full name</FieldLabel>
              <Input
                id="client-full-name"
                autoComplete="name"
                aria-invalid={Boolean(errors.full_name)}
                {...form.register("full_name")}
              />
              <FieldDescription>
                Enter a person&apos;s name or a company name.
              </FieldDescription>
              <FieldError errors={[errors.full_name]} />
            </Field>

            <Field data-invalid={Boolean(errors.company_name)}>
              <FieldLabel htmlFor="client-company-name">Company name</FieldLabel>
              <Input
                id="client-company-name"
                autoComplete="organization"
                aria-invalid={Boolean(errors.company_name)}
                {...form.register("company_name")}
              />
              <FieldError errors={[errors.company_name]} />
            </Field>

            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="client-email">Email</FieldLabel>
              <Input
                id="client-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-invalid={Boolean(errors.email)}
                {...form.register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={Boolean(errors.address)}>
              <FieldLabel htmlFor="client-address">Address</FieldLabel>
              <Textarea
                id="client-address"
                autoComplete="street-address"
                aria-invalid={Boolean(errors.address)}
                {...form.register("address")}
              />
              <FieldError errors={[errors.address]} />
            </Field>

            <Field data-invalid={Boolean(errors.vat_id)}>
              <FieldLabel htmlFor="client-vat-id">VAT ID</FieldLabel>
              <Input
                id="client-vat-id"
                autoComplete="off"
                aria-invalid={Boolean(errors.vat_id)}
                {...form.register("vat_id")}
              />
              <FieldError errors={[errors.vat_id]} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-5">
            <DialogClose
              render={<Button type="button" variant="outline" />}
              disabled={isSubmitting}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
