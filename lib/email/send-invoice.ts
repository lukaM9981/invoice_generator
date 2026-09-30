import "server-only";

import { Resend } from "resend";

import { InvoiceEmail, type InvoiceEmailProps } from "@/lib/email/templates/InvoiceEmail";

export const EMAIL_NOT_CONFIGURED =
  "Email is not configured yet. Add RESEND_API_KEY and EMAIL_FROM to the environment.";

export type EmailResult =
  | { ok: true; messageId: string | null }
  | { ok: false; error: string };

let resend: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** `EMAIL_FROM` may be "billing@domain" or "Name <billing@domain>"; only the address is kept. */
function fromAddress(): string {
  const configured = (process.env.EMAIL_FROM ?? "").trim();
  const match = /<([^>]+)>/.exec(configured);
  return (match ? match[1] : configured).trim();
}

function displayName(name: string): string {
  return name.replace(/["<>\r\n]/g, "").trim().slice(0, 100) || "Invoice Generator";
}

export async function sendInvoiceEmail({
  to,
  replyTo,
  subject,
  pdf,
  filename,
  ...template
}: InvoiceEmailProps & {
  to: string;
  replyTo: string | null;
  subject: string;
  pdf: Buffer;
  filename: string;
}): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    return { ok: false, error: EMAIL_NOT_CONFIGURED };
  }

  resend ??= new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: `"${displayName(template.senderName)}" <${fromAddress()}>`,
      to: [to],
      replyTo: replyTo ?? undefined,
      subject,
      react: InvoiceEmail(template),
      attachments: [{ filename, content: pdf, contentType: "application/pdf" }],
    });

    if (error) {
      return { ok: false, error: error.message || "The email provider rejected the message." };
    }

    return { ok: true, messageId: data?.id ?? null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "The email could not be sent.",
    };
  }
}
