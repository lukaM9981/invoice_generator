import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/queries";
import { getAppOrigin } from "@/lib/auth/urls";
import { isStripeConfigured } from "@/lib/stripe/client";
import { fetchConnectState } from "@/lib/stripe/connect";
import { createClient } from "@/utils/supabase/server";

/** Stripe sends the user here after onboarding, finished or not. */
export async function GET() {
  const origin = await getAppOrigin();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/settings", origin));
  }

  const supabase = createClient(await cookies());
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_account_id || !isStripeConfigured()) {
    return NextResponse.redirect(new URL("/settings", origin));
  }

  try {
    const state = await fetchConnectState(profile.stripe_account_id);
    await supabase
      .from("profiles")
      .update({
        stripe_charges_enabled: state.charges_enabled,
        stripe_details_submitted: state.details_submitted,
      })
      .eq("id", user.id);

    const outcome = state.charges_enabled ? "connected" : "incomplete";
    return NextResponse.redirect(new URL(`/settings?stripe=${outcome}`, origin));
  } catch {
    return NextResponse.redirect(new URL("/settings?stripe=error", origin));
  }
}
