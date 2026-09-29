import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/queries";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create an account",
};

export default async function RegisterPage() {
  if (await getCurrentUser()) {
    redirect(DEFAULT_SIGNED_IN_PATH);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start sending invoices and getting paid directly.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
