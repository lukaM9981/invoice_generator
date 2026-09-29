"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ClientSearch({ query }: { query: string }) {
  const router = useRouter();
  const [sent, setSent] = useState(() => query.trim());
  const [prevQuery, setPrevQuery] = useState(query);
  const [value, setValue] = useState(query);

  if (query !== prevQuery) {
    setPrevQuery(query);
    const trimmedQuery = query.trim();
    if (trimmedQuery !== value.trim() && trimmedQuery !== sent) {
      setSent(trimmedQuery);
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
      const params = new URLSearchParams();
      if (trimmed) {
        params.set("q", trimmed);
      }
      const next = params.toString();
      router.replace(next ? `/clients?${next}` : "/clients");
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [router, sent, value]);

  return (
    <Field>
      <FieldLabel htmlFor="client-search">Search</FieldLabel>
      <Input
        id="client-search"
        type="search"
        value={value}
        placeholder="Name, company, or email"
        onChange={(event) => setValue(event.target.value)}
      />
    </Field>
  );
}
