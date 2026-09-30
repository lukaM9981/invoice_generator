import "server-only";

import { getStripe } from "@/lib/stripe/client";

export type ConnectState = {
  charges_enabled: boolean;
  details_submitted: boolean;
};

/** Standard account: the freelancer is the merchant of record and is paid directly. */
export async function createStandardAccount(userId: string, email: string | null) {
  const account = await getStripe().accounts.create(
    {
      type: "standard",
      email: email ?? undefined,
      metadata: { user_id: userId },
    },
    { idempotencyKey: `connect-account-${userId}` },
  );
  return account.id;
}

export async function createOnboardingLink(accountId: string, origin: string) {
  const link = await getStripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${origin}/api/stripe/connect/start`,
    return_url: `${origin}/api/stripe/connect/return`,
  });
  return link.url;
}

export async function fetchConnectState(accountId: string): Promise<ConnectState> {
  const account = await getStripe().accounts.retrieve(accountId);
  return {
    charges_enabled: Boolean(account.charges_enabled),
    details_submitted: Boolean(account.details_submitted),
  };
}
