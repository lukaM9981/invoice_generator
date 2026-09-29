import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/queries";
import { safeRedirectPath } from "@/lib/auth/routes";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link: "That link is invalid or has expired. Request a new one.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const redirectTo = safeRedirectPath(next);

  if (await getCurrentUser()) {
    redirect(redirectTo);
  }

  const errorMessage =
    typeof error === "string" ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to continue.
        </p>
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <LoginForm next={typeof next === "string" ? next : undefined} />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
