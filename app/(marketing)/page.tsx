import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/queries";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";

export const metadata: Metadata = {
  description:
    "Bill your clients and get paid. Store your sender details, keep a list of clients, build invoices from line items, and send them as payable PDFs.",
};

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-medium tracking-tight">
          Invoice Generator
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          A web application for freelancers who need to bill clients and get
          paid. Store your sender details, keep a list of clients, build
          invoices from line items, send them as PDFs, and let clients pay
          online through a payment link.
        </p>
      </div>

      {/*
        These are navigation links, so they carry the button styling rather than
        the Button component: Base UI's Button enforces button semantics and its
        docs state links must not be rendered through the `render` prop.
      */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {user ? (
          <Link
            href={DEFAULT_SIGNED_IN_PATH}
            className={buttonVariants({ size: "lg" })}
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Create account
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
