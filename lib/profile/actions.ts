"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/queries";
import { profileSchema, type ProfileFormValues } from "@/lib/profile/schemas";
import { createClient } from "@/utils/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const INVALID_INPUT = "Check the form and try again.";
const UNEXPECTED = "Something went wrong. Try again.";

export async function updateProfile(
  values: ProfileFormValues,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      company_name: parsed.data.company_name,
      email: parsed.data.email,
      address: parsed.data.address,
      vat_id: parsed.data.vat_id,
      website: parsed.data.website,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: UNEXPECTED };
  }

  revalidatePath("/settings");
  return { ok: true };
}
