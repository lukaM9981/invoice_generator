"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/queries";
import {
  emailDefaultsSchema,
  profileSchema,
  type EmailDefaultsFormValues,
  type ProfileFormValues,
} from "@/lib/profile/schemas";
import { isStripeConfigured } from "@/lib/stripe/client";
import { deactivatePaymentLink } from "@/lib/stripe/payment-links";
import { createClient } from "@/utils/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const INVALID_INPUT = "Check the form and try again.";
const UNEXPECTED = "Something went wrong. Try again.";

export async function updateProfile(
  values: ProfileFormValues,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      company_name: parsed.data.company_name,
      email: parsed.data.email,
      address: parsed.data.address,
      vat_id: parsed.data.vat_id,
      website: parsed.data.website,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: UNEXPECTED };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateEmailDefaults(
  values: EmailDefaultsFormValues,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = emailDefaultsSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: UNEXPECTED };
  }

  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Forgets the connected account. Paid invoices keep their history; open links
 * on unpaid invoices are switched off so nobody pays into a disconnected account.
 */
export async function disconnectPayments(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient(await cookies());

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .maybeSingle();

  const accountId = profile?.stripe_account_id;
  if (!accountId) {
    return { ok: true };
  }

  const { data: openLinks } = await supabase
    .from("invoices")
    .select("id, stripe_payment_link_id")
    .eq("user_id", user.id)
    .eq("payment_status", "unpaid")
    .not("stripe_payment_link_id", "is", null);

  if (isStripeConfigured()) {
    await Promise.all(
      (openLinks ?? []).map((invoice) =>
        deactivatePaymentLink(accountId, invoice.stripe_payment_link_id!).catch(() => undefined),
      ),
    );
  }

  const { error: invoicesError } = await supabase
    .from("invoices")
    .update({ stripe_payment_link_id: null, stripe_payment_link_url: null })
    .eq("user_id", user.id)
    .eq("payment_status", "unpaid");

  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_account_id: null,
      stripe_charges_enabled: false,
      stripe_details_submitted: false,
    })
    .eq("id", user.id);

  if (error || invoicesError) {
    return { ok: false, error: UNEXPECTED };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  return { ok: true };
}
