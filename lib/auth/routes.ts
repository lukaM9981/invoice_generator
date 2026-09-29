export const DEFAULT_SIGNED_IN_PATH = "/dashboard";
export const SIGN_IN_PATH = "/login";
export const RESET_PASSWORD_PATH = "/reset-password";

/** Everything under these prefixes requires a signed-in user. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/invoices",
  "/clients",
  "/settings",
];

/**
 * Screens that only make sense signed out. `/reset-password` is deliberately
 * absent: it runs on the session the recovery link creates.
 */
export const SIGNED_OUT_ONLY_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
];

export function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Only same-origin absolute paths are accepted, so a crafted `?next=` cannot
 * turn a redirect after sign-in into an open redirect.
 */
export function safeRedirectPath(
  value: string | string[] | undefined | null,
  fallback: string = DEFAULT_SIGNED_IN_PATH,
): string {
  const path = Array.isArray(value) ? value[0] : value;

  // Must be a single-slash-rooted path. A second `/` or any `\` is folded into
  // an authority by browsers and the URL parser, so `/\evil.com` would leave
  // the origin. Control characters are stripped before parsing, so they can
  // smuggle those same characters past this check.
  if (!path || !/^\/[^/\\]/.test(path) || /[\x00-\x1f\x7f]/.test(path)) {
    return fallback;
  }

  return path;
}

/** Builds a redirect URL and rejects values that resolve to another origin. */
export function safeRedirectUrl(
  path: string,
  origin: string,
  fallback: string = DEFAULT_SIGNED_IN_PATH,
): URL {
  const safePath = safeRedirectPath(path, fallback);
  const url = new URL(safePath, origin);

  if (url.origin !== origin) {
    return new URL(fallback, origin);
  }

  return url;
}
