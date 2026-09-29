"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/queries";
import {
  clientIdSchema,
  clientSchema,
  DUPLICATE_CLIENT_EMAIL,
  type ClientFormValues,
} from "@/lib/clients/schemas";
import { createClient } from "@/utils/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const INVALID_INPUT = "Check the form and try again.";
const UNEXPECTED = "Something went wrong. Try again.";
const MISSING_CLIENT = "That client is no longer in your list.";

function escapeIlike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function isDuplicateEmailError(error: { code?: string; message?: string }) {
  return (
    error.code === "23505" ||
    error.message?.includes("clients_active_email_unique") === true
  );
}

async function emailTaken(
  email: string,
  exceptId?: string,
): Promise<boolean | null> {
  const user = await requireUser();
  const supabase = createClient(await cookies());

  let query = supabase
    .from("clients")
    .select("id, email")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .ilike("email", escapeIlike(email))
    .limit(5);

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const { data, error } = await query;

  if (error) {
    return null;
  }

  const needle = email.toLowerCase();
  return (data ?? []).some((row) => row.email?.toLowerCase() === needle);
}

export async function createClientRecord(
  values: ClientFormValues,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = clientSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  if (parsed.data.email) {
    const taken = await emailTaken(parsed.data.email);
    if (taken === null) {
      return { ok: false, error: UNEXPECTED };
    }
    if (taken) {
      return { ok: false, error: DUPLICATE_CLIENT_EMAIL };
    }
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("clients").insert({
    user_id: user.id,
    full_name: parsed.data.full_name,
    company_name: parsed.data.company_name,
    email: parsed.data.email,
    address: parsed.data.address,
    vat_id: parsed.data.vat_id,
  });

  if (error) {
    if (isDuplicateEmailError(error)) {
      return { ok: false, error: DUPLICATE_CLIENT_EMAIL };
    }
    return { ok: false, error: UNEXPECTED };
  }

  revalidatePath("/clients");
  return { ok: true };
}

export async function updateClientRecord(
  id: string,
  values: ClientFormValues,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsedId = clientIdSchema.safeParse(id);
  const parsed = clientSchema.safeParse(values);

  if (!parsedId.success || !parsed.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  if (parsed.data.email) {
    const taken = await emailTaken(parsed.data.email, parsedId.data);
    if (taken === null) {
      return { ok: false, error: UNEXPECTED };
    }
    if (taken) {
      return { ok: false, error: DUPLICATE_CLIENT_EMAIL };
    }
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("clients")
    .update({
      full_name: parsed.data.full_name,
      company_name: parsed.data.company_name,
      email: parsed.data.email,
      address: parsed.data.address,
      vat_id: parsed.data.vat_id,
    })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isDuplicateEmailError(error)) {
      return { ok: false, error: DUPLICATE_CLIENT_EMAIL };
    }
    return { ok: false, error: UNEXPECTED };
  }

  if (!data) {
    return { ok: false, error: MISSING_CLIENT };
  }

  revalidatePath("/clients");
  return { ok: true };
}

export async function archiveClient(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsedId = clientIdSchema.safeParse(id);

  if (!parsedId.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error ? UNEXPECTED : MISSING_CLIENT };
  }

  revalidatePath("/clients");
  return { ok: true };
}
