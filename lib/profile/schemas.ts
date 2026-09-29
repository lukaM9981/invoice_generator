import { z } from "zod";

function optionalText(max: number, tooLong: string) {
  return z
    .string()
    .trim()
    .max(max, { error: tooLong })
    .transform((value) => (value.length === 0 ? null : value));
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const profileSchema = z.object({
  full_name: optionalText(200, "Full name is too long."),
  company_name: optionalText(200, "Company name is too long."),
  email: z
    .string()
    .trim()
    .max(254, { error: "Email address is too long." })
    .refine((value) => value.length === 0 || z.email().safeParse(value).success, {
      error: "Enter a valid email address.",
    })
    .transform((value) => (value.length === 0 ? null : value)),
  address: optionalText(500, "Address is too long."),
  vat_id: optionalText(50, "VAT ID is too long."),
  website: z
    .string()
    .trim()
    .max(200, { error: "Website is too long." })
    .refine((value) => value.length === 0 || isHttpUrl(value), {
      error: "Enter a valid website URL, including https://.",
    })
    .transform((value) => (value.length === 0 ? null : value)),
});

export type ProfileFormValues = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;

export type ProfileSender = ProfileValues;
