"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateEmailDefaults } from "@/lib/profile/actions";
import {
  emailDefaultsSchema,
  type EmailDefaultsFormValues,
} from "@/lib/profile/schemas";

export function EmailDefaultsForm({
  subject,
  body,
}: {
  subject: string | null;
  body: string | null;
}) {
  const form = useForm<EmailDefaultsFormValues>({
    resolver: zodResolver(emailDefaultsSchema, undefined, { raw: true }),
    defaultValues: {
      default_email_subject: subject ?? "",
      default_email_body: body ?? "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: EmailDefaultsFormValues) {
    const result = await updateEmailDefaults(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    form.reset(values);
    toast.success("Email message saved.");
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Email message</CardTitle>
        <CardDescription>
          Pre-filled every time you send an invoice. You can still change it before each send.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent className="pb-5">
          <FieldGroup>
            <Field data-invalid={Boolean(errors.default_email_subject)}>
              <FieldLabel htmlFor="default_email_subject">Subject</FieldLabel>
              <Input
                id="default_email_subject"
                placeholder="Invoice from your company"
                aria-invalid={Boolean(errors.default_email_subject)}
                {...form.register("default_email_subject")}
              />
              <FieldDescription>
                Leave empty to use &ldquo;Invoice [number] from [your name]&rdquo;.
              </FieldDescription>
              <FieldError errors={[errors.default_email_subject]} />
            </Field>

            <Field data-invalid={Boolean(errors.default_email_body)}>
              <FieldLabel htmlFor="default_email_body">Message</FieldLabel>
              <Textarea
                id="default_email_body"
                rows={6}
                aria-invalid={Boolean(errors.default_email_body)}
                {...form.register("default_email_body")}
              />
              <FieldDescription>
                The invoice number, amount, due date, and payment button are always added
                below your message.
              </FieldDescription>
              <FieldError errors={[errors.default_email_body]} />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
