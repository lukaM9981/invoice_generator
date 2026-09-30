import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="font-heading text-2xl font-medium">Not found</h1>
      <p className="text-sm text-muted-foreground">
        This page doesn&apos;t exist, or it was deleted.
      </p>
      <Link href="/invoices" className={buttonVariants({ variant: "outline" })}>
        Go to invoices
      </Link>
    </div>
  );
}
