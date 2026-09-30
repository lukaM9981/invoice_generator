import type Stripe from "stripe";

import { toMinorUnits } from "@/lib/invoices/calculations";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { deactivatePaymentLink } from "@/lib/stripe/payment-links";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

async function handleCheckoutCompleted(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
  accountId: string | null,
) {
  if (session.payment_status !== "paid" || !accountId) {
    return;
  }

  const linkId =
    typeof session.payment_link === "string" ? session.payment_link : session.payment_link?.id;

  let query = admin
    .from("invoices")
    .select("id, user_id, total, currency, status, payment_status, stripe_payment_link_id");
  if (linkId) {
    query = query.eq("stripe_payment_link_id", linkId);
  } else if (session.metadata?.invoice_id) {
    query = query.eq("id", session.metadata.invoice_id);
  } else {
    return;
  }

  const { data: invoice } = await query.maybeSingle();
  if (!invoice || invoice.status !== "finalized" || invoice.payment_status === "paid") {
    return;
  }

  const { data: owner } = await admin
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", invoice.user_id)
    .maybeSingle();

  if (!owner?.stripe_account_id || owner.stripe_account_id !== accountId) {
    return;
  }

  if (
    session.amount_total !== toMinorUnits(invoice.total) ||
    session.currency?.toLowerCase() !== invoice.currency.toLowerCase()
  ) {
    return;
  }

  const { error } = await admin
    .from("invoices")
    .update({
      payment_status: "paid",
      paid_source: "stripe",
      paid_at: new Date((session.created ?? Date.now() / 1000) * 1000).toISOString(),
      stripe_checkout_session_id: session.id,
      stripe_payment_link_id: null,
      stripe_payment_link_url: null,
    })
    .eq("id", invoice.id)
    .eq("user_id", invoice.user_id)
    .eq("payment_status", "unpaid");

  if (error) {
    throw error;
  }

  if (invoice.stripe_payment_link_id) {
    await deactivatePaymentLink(accountId, invoice.stripe_payment_link_id).catch(() => undefined);
  }
}

async function handleAccountUpdated(admin: AdminClient, account: Stripe.Account) {
  const { error } = await admin
    .from("profiles")
    .update({
      stripe_charges_enabled: Boolean(account.charges_enabled),
      stripe_details_submitted: Boolean(account.details_submitted),
    })
    .eq("stripe_account_id", account.id);

  if (error) {
    throw error;
  }
}

async function handleDeauthorized(admin: AdminClient, accountId: string) {
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_account_id", accountId)
    .maybeSingle();

  if (!profile) {
    return;
  }

  await admin
    .from("invoices")
    .update({ stripe_payment_link_id: null, stripe_payment_link_url: null })
    .eq("user_id", profile.id)
    .eq("payment_status", "unpaid");

  await admin
    .from("profiles")
    .update({
      stripe_account_id: null,
      stripe_charges_enabled: false,
      stripe_details_submitted: false,
    })
    .eq("id", profile.id);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret || !isStripeConfigured()) {
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature ?? "", secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createAdminClient();
  const accountId = event.account ?? null;

  const { error: insertError } = await admin.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    account_id: accountId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return new Response("Already processed", { status: 200 });
    }
    return new Response("Could not record event", { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(admin, event.data.object, accountId);
        break;
      case "account.updated":
        await handleAccountUpdated(admin, event.data.object);
        break;
      case "account.application.deauthorized":
        if (accountId) {
          await handleDeauthorized(admin, accountId);
        }
        break;
      default:
        break;
    }
  } catch {
    // Forget the event so Stripe's retry is processed instead of skipped.
    await admin.from("stripe_events").delete().eq("id", event.id);
    return new Response("Processing failed", { status: 500 });
  }

  await admin
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", event.id);

  return new Response("ok", { status: 200 });
}
