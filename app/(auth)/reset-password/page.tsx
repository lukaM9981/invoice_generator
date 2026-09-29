import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth/queries";
import { hasRecoveryGrant } from "@/lib/auth/recovery-grant";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser();
  const canReset = Boolean(user && hasRecoveryGrant(cookieStore));

  if (!canReset) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Link expired
          </h1>
          <p className="text-sm text-muted-foreground">
            This reset link is no longer valid. Request a new one and try again.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Request a new link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          {user?.email
            ? `Setting a new password for ${user.email}.`
            : "Set a new password for your account."}
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
