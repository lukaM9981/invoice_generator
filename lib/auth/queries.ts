import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

/**
 * The single place the app resolves who is signed in. `getClaims()` verifies
 * the JWT signature, unlike `getSession()`, whose contents are not revalidated.
 */
export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return {
    id: data.claims.sub,
    email: data.claims.email ?? null,
  };
});

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
