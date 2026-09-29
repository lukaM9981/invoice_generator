import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-2xl font-medium">Settings</h1>
      <p className="text-sm text-muted-foreground">
        Profile and Stripe Connect will appear here in the next milestone.
      </p>
    </div>
  );
}
