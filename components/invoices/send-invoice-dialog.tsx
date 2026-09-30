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
import { sendInvoice } from "@/lib/invoices/actions";
import { sendInvoiceSchema, type SendInvoiceFormValues } from "@/lib/invoices/schemas";

export type SendDialogDefaults = {
  to_email: string;
  subject: string;
  body: string;
};

export function SendInvoiceDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  defaults,
  isPaid,
  paymentsReady,
  hasSavedEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  defaults: SendDialogDefaults;
  isPaid: boolean;
  paymentsReady: boolean;
  hasSavedEmail: boolean;
}) {
  const router = useRouter();
  const form = useForm<SendInvoiceFormValues>({
    resolver: zodResolver(sendInvoiceSchema, undefined, { raw: true }),
    defaultValues: defaults,
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: SendInvoiceFormValues) {
    const result = await sendInvoice(invoiceId, values);
    router.refresh();

    if (!result.ok) {
      toast.error(`Not sent: ${result.error}`);
      return;
    }

    toast.success(
      result.withPaymentLink
        ? `Invoice ${invoiceNumber} sent with a payment link.`
        : `Invoice ${invoiceNumber} sent.`,
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Send invoice {invoiceNumber}</DialogTitle>
          <DialogDescription>
            The PDF is attached. Replies go straight to your email address.
          </DialogDescription>
        </DialogHeader>

        {!isPaid && !paymentsReady ? (
          <p
            role="note"
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
          >
            Online payments aren&apos;t set up, so this email goes out without a payment
            link. Connect Stripe in Settings to include one.
          </p>
        ) : null}

        <form className="contents" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.to_email)}>
              <FieldLabel htmlFor="send-to">To</FieldLabel>
              <Input
                id="send-to"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.to_email)}
                {...form.register("to_email")}
              />
              {!hasSavedEmail ? (
                <FieldDescription>
                  This client has no email address yet. The one you enter is saved to the client.
                </FieldDescription>
              ) : null}
              <FieldError errors={[errors.to_email]} />
            </Field>

            <Field data-invalid={Boolean(errors.subject)}>
              <FieldLabel htmlFor="send-subject">Subject</FieldLabel>
              <Input
                id="send-subject"
                aria-invalid={Boolean(errors.subject)}
                {...form.register("subject")}
              />
              <FieldError errors={[errors.subject]} />
            </Field>

            <Field data-invalid={Boolean(errors.body)}>
              <FieldLabel htmlFor="send-body">Message</FieldLabel>
              <Textarea
                id="send-body"
                rows={8}
                aria-invalid={Boolean(errors.body)}
                {...form.register("body")}
              />
              <FieldDescription>
                The amount, due date{!isPaid && paymentsReady ? ", and a payment button" : ""} are
                added below your message.
              </FieldDescription>
              <FieldError errors={[errors.body]} />
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
              {isSubmitting ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
