import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_SIGNED_IN_PATH,
  PROTECTED_PREFIXES,
  SIGNED_OUT_ONLY_PREFIXES,
  SIGN_IN_PATH,
  matchesPrefix,
} from "@/lib/auth/routes";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Refreshes the Supabase session on every request and redirects optimistically.
 * The redirects are a UX shortcut only — the `(app)` layout, every server
 * action, and row-level security are what actually protect the data.
 */
export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!isAuthenticated && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = SIGN_IN_PATH;
    url.search = "";
    url.searchParams.set("next", pathname);

    return redirectKeepingCookies(url, response);
  }

  if (isAuthenticated && matchesPrefix(pathname, SIGNED_OUT_ONLY_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_SIGNED_IN_PATH;
    url.search = "";

    return redirectKeepingCookies(url, response);
  }

  return response;
}

/** A refreshed token is written to `response`, so it must survive the redirect. */
function redirectKeepingCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);

  response.cookies
    .getAll()
    .forEach((cookie) => redirectResponse.cookies.set(cookie));

  return redirectResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
