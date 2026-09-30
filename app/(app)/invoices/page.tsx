import type { Metadata } from "next";
import Link from "next/link";

import { InvoiceListFilters } from "@/components/invoices/invoice-list-filters";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { listInvoices } from "@/lib/invoices/queries";
import { parseStatusFilter, type InvoiceStatusFilter } from "@/lib/invoices/schemas";

export const metadata: Metadata = {
  title: "Invoices",
};

function pageHref(page: number, status: InvoiceStatusFilter, query: string) {
  const params = new URLSearchParams();
  if (status !== "all") {
    params.set("status", status);
  }
  if (query) {
    params.set("q", query);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const search = params.toString();
  return search ? `/invoices?${search}` : "/invoices";
}

function visiblePages(current: number, count: number): number[] {
  const start = Math.max(1, Math.min(current - 2, count - 4));
  const end = Math.min(count, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default async function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  const params = await searchParams;
  const status = parseStatusFilter(params.status);
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const page = typeof params.page === "string" ? Number.parseInt(params.page, 10) || 1 : 1;

  const result = await listInvoices({ page, status, search: query });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-medium">Invoices</h1>
          <p className="text-sm text-muted-foreground">Everything you have billed, newest first.</p>
        </div>
        <Link href="/invoices/new" className={buttonVariants()}>
          New invoice
        </Link>
      </div>

      <InvoiceListFilters status={status} query={query} />

      {!result ? (
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your invoices. Refresh the page and try again.
        </p>
      ) : result.items.length === 0 ? (
        <p className="rounded-xl border px-4 py-8 text-sm text-muted-foreground">
          {query || status !== "all"
            ? "No invoices match these filters."
            : "You have no invoices yet. Create one to get started."}
        </p>
      ) : (
        <>
          <InvoiceTable items={result.items} />

          {result.pageCount > 1 ? (
            <Pagination>
              <PaginationContent>
                {result.page > 1 ? (
                  <PaginationItem>
                    <PaginationPrevious href={pageHref(result.page - 1, status, query)} />
                  </PaginationItem>
                ) : null}
                {visiblePages(result.page, result.pageCount).map((number) => (
                  <PaginationItem key={number}>
                    <PaginationLink
                      href={pageHref(number, status, query)}
                      isActive={number === result.page}
                    >
                      {number}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {result.page < result.pageCount ? (
                  <PaginationItem>
                    <PaginationNext href={pageHref(result.page + 1, status, query)} />
                  </PaginationItem>
                ) : null}
              </PaginationContent>
            </Pagination>
          ) : null}

          <p className="text-center text-xs text-muted-foreground">
            {result.total} {result.total === 1 ? "invoice" : "invoices"}
          </p>
        </>
      )}
    </div>
  );
}
