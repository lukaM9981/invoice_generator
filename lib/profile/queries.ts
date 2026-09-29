import "server-only";

import { cookies } from "next/headers";

import { requireUser } from "@/lib/auth/queries";
import type { ProfileSender } from "@/lib/profile/schemas";
import { createClient } from "@/utils/supabase/server";

export type { ProfileSender };

const PROFILE_COLUMNS =
  "full_name, company_name, email, address, vat_id, website" as const;

export async function getProfile(): Promise<ProfileSender | null> {
  const user = await requireUser();
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
