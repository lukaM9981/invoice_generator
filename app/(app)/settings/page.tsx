import type { Metadata } from "next";

import { ProfileForm } from "@/components/profile/profile-form";
import { getProfile } from "@/lib/profile/queries";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your details are printed on every invoice you send.
        </p>
      </div>

      {profile ? (
        <ProfileForm profile={profile} />
      ) : (
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your profile. Refresh the page and try again.
        </p>
      )}
    </div>
  );
}
