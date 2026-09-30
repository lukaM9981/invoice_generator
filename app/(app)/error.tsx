"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="font-heading text-2xl font-medium">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        This page couldn&apos;t be loaded. Your data is safe. Try again in a moment.
      </p>
      <Button type="button" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
