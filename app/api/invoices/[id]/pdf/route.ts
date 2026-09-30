import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth/queries";
import { downloadPdf } from "@/lib/invoices/pdf/render";
import { invoiceIdSchema } from "@/lib/invoices/schemas";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request, context: RouteContext<"/api/invoices/[id]/pdf">) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  if (!invoiceIdSchema.safeParse(id).success) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const versionParam = url.searchParams.get("version");
  const version = versionParam ? Number.parseInt(versionParam, 10) : null;
  const inline = url.searchParams.get("disposition") === "inline";

  const supabase = createClient(await cookies());
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!invoice?.invoice_number) {
    return new Response("Not found", { status: 404 });
  }

  let query = supabase
    .from("invoice_pdfs")
    .select("version, storage_path")
    .eq("invoice_id", invoice.id)
    .eq("user_id", user.id);
  query =
    version && Number.isFinite(version)
      ? query.eq("version", version)
      : query.order("version", { ascending: false }).limit(1);

  const { data: pdf } = await query.maybeSingle();
  if (!pdf) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await downloadPdf(supabase, pdf.storage_path);
  if (!buffer) {
    return new Response("The PDF could not be loaded.", { status: 502 });
  }

  const filename =
    pdf.version > 1 && version ? `${invoice.invoice_number}-v${pdf.version}.pdf` : `${invoice.invoice_number}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(buffer.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
