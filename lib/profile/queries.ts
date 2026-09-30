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

export type ProfileSettings = {
  sender: ProfileSender;
  emailDefaults: { subject: string | null; body: string | null };
  payments: {
    state: "not_connected" | "incomplete" | "ready";
    accountId: string | null;
  };
};

export async function getProfileSettings(): Promise<ProfileSettings | null> {
  const user = await requireUser();
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `${PROFILE_COLUMNS}, default_email_subject, default_email_body, stripe_account_id, stripe_charges_enabled`,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    sender: {
      full_name: data.full_name,
      company_name: data.company_name,
      email: data.email,
      address: data.address,
      vat_id: data.vat_id,
      website: data.website,
    },
    emailDefaults: {
      subject: data.default_email_subject,
      body: data.default_email_body,
    },
    payments: {
      state: !data.stripe_account_id
        ? "not_connected"
        : data.stripe_charges_enabled
          ? "ready"
          : "incomplete",
      accountId: data.stripe_account_id,
    },
  };
}
