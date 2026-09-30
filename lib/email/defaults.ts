import { formatMoney } from "@/lib/invoices/calculations";
import { formatDate } from "@/lib/invoices/status";

/** Fallback wording used when the profile has no default subject or message. */
export function defaultEmailContent({
  profileSubject,
  profileBody,
  senderName,
  invoiceNumber,
  total,
  currency,
  dueDate,
}: {
  profileSubject: string | null;
  profileBody: string | null;
  senderName: string;
  invoiceNumber: string;
  total: string;
  currency: string;
  dueDate: string;
}): { subject: string; body: string } {
  return {
    subject: profileSubject?.trim() || `Invoice ${invoiceNumber} from ${senderName}`,
    body:
      profileBody?.trim() ||
      `Hello,\n\nPlease find attached invoice ${invoiceNumber} for ${formatMoney(total, currency)}, due on ${formatDate(dueDate)}.\n\nThank you,\n${senderName}`,
  };
}
