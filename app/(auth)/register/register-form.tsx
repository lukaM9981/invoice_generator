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
import { register as registerAccount } from "@/lib/auth/actions";
import { registerSchema, type RegisterInput } from "@/lib/auth/schemas";

export function RegisterForm() {
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: RegisterInput) {
    const result = await registerAccount(values);

    if (result && !result.ok) {
      toast.error(result.error);
    }
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

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
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
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  );
}
