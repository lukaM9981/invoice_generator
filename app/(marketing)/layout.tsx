export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
