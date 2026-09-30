"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InvoiceStatusFilter } from "@/lib/invoices/schemas";

const STATUS_TABS: { value: InvoiceStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "unpaid", label: "Unpaid" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

function buildHref(status: InvoiceStatusFilter, query: string) {
  const params = new URLSearchParams();
  if (status !== "all") {
    params.set("status", status);
  }
  if (query) {
    params.set("q", query);
  }
  const search = params.toString();
  return search ? `/invoices?${search}` : "/invoices";
}

export function InvoiceListFilters({
  status,
  query,
}: {
  status: InvoiceStatusFilter;
  query: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const [sent, setSent] = useState(query.trim());
  const [prevQuery, setPrevQuery] = useState(query);

  if (query !== prevQuery) {
    setPrevQuery(query);
    if (query.trim() !== value.trim() && query.trim() !== sent) {
      setSent(query.trim());
      setValue(query);
    }
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === sent) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSent(trimmed);
      router.replace(buildHref(status, trimmed));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [router, sent, status, value]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <Tabs
        value={status}
        onValueChange={(next) => router.replace(buildHref(next as InvoiceStatusFilter, sent))}
      >
        <TabsList className="max-w-full overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Field className="md:max-w-xs">
        <FieldLabel htmlFor="invoice-search" className="sr-only">
          Search invoices
        </FieldLabel>
        <Input
          id="invoice-search"
          type="search"
          value={value}
          placeholder="Search client or invoice number"
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
    </div>
  );
}
