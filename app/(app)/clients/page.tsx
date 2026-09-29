import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients",
};

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-2xl font-medium">Clients</h1>
      <p className="text-sm text-muted-foreground">
        Client management will appear here in the next milestone.
      </p>
    </div>
  );
}
