import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark grid min-h-full flex-1 bg-background text-foreground lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Link
            href="/"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            Invoice Generator
          </Link>

          {children}
        </div>
      </div>

      <div className="hidden items-center bg-muted px-16 lg:flex">
        <div className="flex max-w-md flex-col gap-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            Invoice clients in minutes
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Create PDF invoices, connect Stripe for payment links if you want,
            and email everything to your clients from one simple workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
