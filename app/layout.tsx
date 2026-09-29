import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Invoice Generator",
    template: "%s · Invoice Generator",
  },
  description: "Create, send, and track invoices, and get paid directly.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, geistMono.variable)}
    >
      {/*
        `suppressHydrationWarning` covers attributes browser extensions inject
        into `body` before React hydrates, such as ColorZilla's
        `cz-shortcut-listen`. It applies to this element's own attributes only,
        so genuine mismatches inside the tree are still reported.
      */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
