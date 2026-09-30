import type { Metadata } from "next";

import { EmailDefaultsForm } from "@/components/profile/email-defaults-form";
import { PaymentConnectionCard } from "@/components/profile/payment-connection-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { getProfileSettings } from "@/lib/profile/queries";
import { isStripeConfigured } from "@/lib/stripe/client";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const [{ stripe }, settings] = await Promise.all([searchParams, getProfileSettings()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your details are printed on every invoice you send.
        </p>
      </div>

      {settings ? (
        <>
          <ProfileForm profile={settings.sender} />
          <EmailDefaultsForm
            subject={settings.emailDefaults.subject}
            body={settings.emailDefaults.body}
          />
          <PaymentConnectionCard
            state={settings.payments.state}
            stripeConfigured={isStripeConfigured()}
            returnStatus={typeof stripe === "string" ? stripe : null}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your profile. Refresh the page and try again.
        </p>
      )}
    </div>
  );
}
