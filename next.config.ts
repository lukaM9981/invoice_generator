import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./lib/invoices/pdf/fonts/**"],
  },
};

export default nextConfig;
