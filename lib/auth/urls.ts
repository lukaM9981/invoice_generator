import "server-only";

import { headers } from "next/headers";

/** Absolute origin used for the links Supabase puts in emails. */
export async function getAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  const forwardedProto = headerStore.get("x-forwarded-proto");
  const isLocalhost =
    host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol = forwardedProto ?? (isLocalhost ? "http" : "https");

  return `${protocol}://${host}`;
}
