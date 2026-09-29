import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user.email ?? "your account"}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nothing here yet</CardTitle>
          <CardDescription>
            Summary figures and recent invoices will appear here once invoicing
            is built.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Authentication is in place, so the rest of the application can be
          built behind this screen.
        </CardContent>
      </Card>
    </div>
  );
}
