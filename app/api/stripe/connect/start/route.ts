import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/queries";
import { getAppOrigin } from "@/lib/auth/urls";
import { isStripeConfigured } from "@/lib/stripe/client";
import { createOnboardingLink, createStandardAccount } from "@/lib/stripe/connect";
import { createClient } from "@/utils/supabase/server";

/** Starts (or resumes) Stripe's hosted onboarding. Also Stripe's `refresh_url`. */
export async function GET() {
  const origin = await getAppOrigin();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/settings", origin));
  }
  if (!isStripeConfigured()) {
    return NextResponse.redirect(new URL("/settings?stripe=not_configured", origin));
  }

  const supabase = createClient(await cookies());
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id, email")
    .eq("id", user.id)
    .maybeSingle();

  try {
    let accountId = profile?.stripe_account_id ?? null;

    if (!accountId) {
      accountId = await createStandardAccount(user.id, profile?.email ?? user.email);
      const { error } = await supabase
        .from("profiles")
        .update({
          stripe_account_id: accountId,
          stripe_charges_enabled: false,
          stripe_details_submitted: false,
        })
        .eq("id", user.id);
      if (error) {
        throw error;
      }
    }

    const url = await createOnboardingLink(accountId, origin);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/settings?stripe=error", origin));
  }
}
