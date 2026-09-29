"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/auth/actions";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/auth/schemas";

export function ResetPasswordForm() {
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ResetPasswordInput) {
    const result = await resetPassword(values);

    if (result && !result.ok) {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input
            id="password"
            type="password"
            className="h-9"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...form.register("password")}
          />
          <FieldDescription>At least 8 characters.</FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>

        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            className="h-9"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...form.register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Save new password"}
        </Button>
      </FieldGroup>
    </form>
  );
}
