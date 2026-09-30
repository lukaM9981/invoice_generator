"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { disconnectPayments } from "@/lib/profile/actions";

const STATE_COPY = {
  not_connected: {
    badge: "Not connected",
    text: "Connect a Stripe account so clients can pay your invoices online. Money goes straight to you; this app takes no commission.",
    action: "Connect Stripe",
  },
  incomplete: {
    badge: "Onboarding incomplete",
    text: "Stripe still needs a few details before you can accept payments. Invoices you send now go out without a payment link.",
    action: "Continue onboarding",
  },
  ready: {
    badge: "Ready to accept payments",
    text: "Every invoice you send includes a link for the exact amount. Paid invoices are marked automatically.",
    action: "Open Stripe onboarding",
  },
} as const;

const RETURN_MESSAGES: Record<string, string> = {
  connected: "Stripe is connected. You can accept payments now.",
  incomplete: "Stripe still needs more details before you can accept payments.",
  error: "We couldn't reach Stripe. Try again in a moment.",
  not_configured: "Payments are not configured on this server yet (STRIPE_SECRET_KEY is missing).",
};

export function PaymentConnectionCard({
  state,
  stripeConfigured,
  returnStatus,
}: {
  state: keyof typeof STATE_COPY;
  stripeConfigured: boolean;
  returnStatus: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const copy = STATE_COPY[state];
  const notice = returnStatus ? RETURN_MESSAGES[returnStatus] : null;

  async function onDisconnect() {
    setPending(true);
    const result = await disconnectPayments();
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
    toast.success("Stripe disconnected.");
    router.refresh();
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Online payments
          <Badge variant={state === "ready" ? "default" : "secondary"}>{copy.badge}</Badge>
        </CardTitle>
        <CardDescription>{copy.text}</CardDescription>
      </CardHeader>
      {notice || !stripeConfigured ? (
        <CardContent>
          <p role="status" className="text-sm text-muted-foreground">
            {notice ?? RETURN_MESSAGES.not_configured}
          </p>
        </CardContent>
      ) : null}
      <CardFooter className="flex flex-wrap gap-2">
        {state !== "ready" ? (
          <a
            href="/api/stripe/connect/start"
            aria-disabled={!stripeConfigured}
            className={buttonVariants({
              className: stripeConfigured ? undefined : "pointer-events-none opacity-50",
            })}
          >
            {copy.action}
          </a>
        ) : null}
        {state !== "not_connected" ? (
          <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
            <AlertDialogTrigger render={<Button type="button" variant="outline" />}>
              Disconnect
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Stripe?</AlertDialogTitle>
                <AlertDialogDescription>
                  Paid invoices stay as they are. Payment links on unpaid invoices stop
                  working, and new sends go out without a link until you connect again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" disabled={pending} onClick={onDisconnect}>
                  {pending ? "Disconnecting…" : "Disconnect"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </CardFooter>
    </Card>
  );
}
