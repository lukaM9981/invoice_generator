import { z } from "zod";

export const DUPLICATE_CLIENT_EMAIL =
  "Another client already uses this email.";

function optionalText(max: number, tooLong: string) {
  return z
    .string()
    .trim()
    .max(max, { error: tooLong })
    .transform((value) => (value.length === 0 ? null : value));
}

export const clientSchema = z
  .object({
    full_name: optionalText(200, "Full name is too long."),
    company_name: optionalText(200, "Company name is too long."),
    email: z
      .string()
      .trim()
      .max(254, { error: "Email address is too long." })
      .refine(
        (value) => value.length === 0 || z.email().safeParse(value).success,
        { error: "Enter a valid email address." },
      )
      .transform((value) => (value.length === 0 ? null : value)),
    address: optionalText(500, "Address is too long."),
    vat_id: optionalText(50, "VAT ID is too long."),
  })
  .refine((value) => Boolean(value.full_name || value.company_name), {
    error: "Enter a person's name or a company name.",
    path: ["full_name"],
  });

export const clientIdSchema = z.uuid();

export type ClientFormValues = z.input<typeof clientSchema>;
export type ClientValues = z.output<typeof clientSchema>;
