"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import Link from "next/link";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { login } from "@/lib/auth/actions";
import { loginSchema, type LoginInput } from "@/lib/auth/schemas";

export function LoginForm({ next }: { next?: string }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginInput) {
    const result = await login(values, next);

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
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-sm font-normal text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <InputGroup className="h-9">
            <InputGroupInput
              id="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...form.register("password")}
              type={passwordVisible ? "text" : "password"}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={
                  passwordVisible ? "Hide password" : "Show password"
                }
                onClick={() => setPasswordVisible((visible) => !visible)}
              >
                {passwordVisible ? (
                  <RiEyeOffLine aria-hidden="true" />
                ) : (
                  <RiEyeLine aria-hidden="true" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[errors.password]} />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  );
}
