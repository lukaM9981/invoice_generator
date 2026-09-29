"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/auth/actions";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/auth/schemas";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ForgotPasswordInput) {
    const result = await requestPasswordReset(values);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        If that address belongs to an account, a reset link is on its way. The
        link is valid for a short time only.
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            className="h-9"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </FieldGroup>
    </form>
  );
}
