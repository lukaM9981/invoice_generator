"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth/queries";
import {
  clearRecoveryGrantCookie,
  hasRecoveryGrant,
} from "@/lib/auth/recovery-grant";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/auth/schemas";
import {
  DEFAULT_SIGNED_IN_PATH,
  SIGN_IN_PATH,
  safeRedirectPath,
} from "@/lib/auth/routes";
import { getAppOrigin } from "@/lib/auth/urls";

export type ActionResult = { ok: true } | { ok: false; error: string };

const INVALID_INPUT = "Check the form and try again.";
const RATE_LIMITED = "Too many attempts. Wait a few minutes and try again.";
const UNEXPECTED = "Something went wrong. Try again.";

export async function login(
  values: LoginInput,
  next?: string,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        ok: false,
        error: "Confirm your email address first — check your inbox for the link.",
      };
    }

    if (error.status === 429) {
      return { ok: false, error: RATE_LIMITED };
    }

    // Deliberately the same message for unknown emails and wrong passwords.
    return { ok: false, error: "Incorrect email or password." };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(next));
}

export async function register(values: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await getAppOrigin()}/confirm?next=/dashboard`,
    },
  });

  if (error) {
    if (error.status === 429) {
      return { ok: false, error: RATE_LIMITED };
    }

    if (error.code === "weak_password") {
      return { ok: false, error: "Choose a stronger password." };
    }

    return { ok: false, error: UNEXPECTED };
  }

  // With email confirmation on, Supabase returns an obfuscated user for an
  // address that already exists, so this screen never confirms who is signed up.
  redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function requestPasswordReset(
  values: ForgotPasswordInput,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await getAppOrigin()}/confirm?next=/reset-password`,
  });

  if (error?.status === 429) {
    return { ok: false, error: RATE_LIMITED };
  }

  // Supabase sends nothing for an unknown address and reports no error, so the
  // caller cannot tell whether the account exists.
  return { ok: true };
}

export async function resetPassword(
  values: ResetPasswordInput,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const cookieStore = await cookies();
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      error: "Your reset link has expired. Request a new one.",
    };
  }

  if (!hasRecoveryGrant(cookieStore)) {
    return {
      ok: false,
      error: "Your reset link has expired. Request a new one.",
    };
  }

  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "same_password") {
      return { ok: false, error: "Choose a password you have not used before." };
    }

    if (error.code === "weak_password") {
      return { ok: false, error: "Choose a stronger password." };
    }

    return { ok: false, error: UNEXPECTED };
  }

  clearRecoveryGrantCookie(cookieStore);

  revalidatePath("/", "layout");
  redirect(DEFAULT_SIGNED_IN_PATH);
}

export async function signOut(): Promise<void> {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect(SIGN_IN_PATH);
}
