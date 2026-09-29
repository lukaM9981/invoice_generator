import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { setRecoveryGrantCookie } from "@/lib/auth/recovery-grant";
import {
  RESET_PASSWORD_PATH,
  safeRedirectPath,
  safeRedirectUrl,
} from "@/lib/auth/routes";
import { createClient } from "@/utils/supabase/server";

const ALLOWED_OTP_TYPES = new Set(["signup", "recovery"]);

function isRecoveryFlow(
  type: string | null,
  next: string,
): boolean {
  return type === "recovery" || next === RESET_PASSWORD_PATH;
}

/**
 * Landing point for the links Supabase emails: signup confirmation and
 * password recovery. Exchanges the token for a session, then hands the user on
 * to `next`.
 *
 * Both shapes are accepted: `code` comes from the stock email templates, and
 * `token_hash` from templates rewritten to point straight here.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const next = safeRedirectPath(searchParams.get("next"));
  const redirectUrl = safeRedirectUrl(next, origin);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return buildRedirectResponse(
        redirectUrl,
        cookieStore,
        isRecoveryFlow(null, next),
      );
    }
  } else if (tokenHash && typeParam) {
    if (!ALLOWED_OTP_TYPES.has(typeParam)) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_link", origin),
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam as "signup" | "recovery",
      token_hash: tokenHash,
    });

    if (!error) {
      return buildRedirectResponse(
        redirectUrl,
        cookieStore,
        isRecoveryFlow(typeParam, next),
      );
    }
  }

  return NextResponse.redirect(new URL("/login?error=invalid_link", origin));
}

function buildRedirectResponse(
  url: URL,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  recovery: boolean,
) {
  const response = NextResponse.redirect(url);

  if (recovery) {
    setRecoveryGrantCookie({
      set(name, value, options) {
        response.cookies.set(name, value, options);
      },
      delete(name) {
        response.cookies.delete(name);
      },
    });
  }

  // Mirror any auth cookies the server client wrote during the exchange.
  cookieStore.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}
