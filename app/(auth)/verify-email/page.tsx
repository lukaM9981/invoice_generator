import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confirm your email",
};

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const { email } = await searchParams;
  const address = typeof email === "string" ? email : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Confirm your email
        </h1>
        <p className="text-sm text-muted-foreground">
          {address ? (
            <>
              We sent a confirmation link to{" "}
              <span className="font-medium text-foreground">{address}</span>.
            </>
          ) : (
            <>We sent you a confirmation link.</>
          )}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Open the link to activate your account. You can close this tab — the
        link signs you in and takes you to your dashboard.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
