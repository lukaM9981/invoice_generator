import "server-only";

import { toMinorUnits } from "@/lib/invoices/calculations";
import { getStripe } from "@/lib/stripe/client";

export type CreatedPaymentLink = { id: string; url: string };

/**
 * Payment Links need a Price, so each invoice gets its own Product and Price
 * on the connected account. `generation` changes whenever a fresh link is
 * required, so a retried request reuses the same objects instead of creating
 * a second live link.
 */
export async function createInvoicePaymentLink({
  accountId,
  invoiceId,
  userId,
  invoiceNumber,
  currency,
  total,
  generation,
}: {
  accountId: string;
  invoiceId: string;
  userId: string;
  invoiceNumber: string;
  currency: string;
  total: string;
  generation: string;
}): Promise<CreatedPaymentLink> {
  const stripe = getStripe();
  const keyBase = `invoice-${invoiceId}-${generation}`;
  const metadata = { invoice_id: invoiceId, user_id: userId };

  const product = await stripe.products.create(
    { name: `Invoice ${invoiceNumber}`, metadata },
    { stripeAccount: accountId, idempotencyKey: `${keyBase}-product` },
  );

  const price = await stripe.prices.create(
    {
      product: product.id,
      currency: currency.toLowerCase(),
      unit_amount: toMinorUnits(total),
    },
    { stripeAccount: accountId, idempotencyKey: `${keyBase}-price` },
  );

  const link = await stripe.paymentLinks.create(
    {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata,
      payment_intent_data: { metadata },
    },
    { stripeAccount: accountId, idempotencyKey: `${keyBase}-link` },
  );

  return { id: link.id, url: link.url };
}

/** Links cannot be deleted, only switched off. */
export async function deactivatePaymentLink(accountId: string, linkId: string) {
  await getStripe().paymentLinks.update(
    linkId,
    { active: false },
    { stripeAccount: accountId },
  );
}
