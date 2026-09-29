/** Short-lived flag set by `/confirm` after a successful recovery exchange. */
export const RECOVERY_GRANT_COOKIE = "recovery_grant";

const GRANT_VALUE = "1";
const GRANT_MAX_AGE_SECONDS = 15 * 60;

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

type CookieWriter = {
  set(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      sameSite?: "lax" | "strict" | "none";
      secure?: boolean;
      maxAge?: number;
      path?: string;
    },
  ): void;
  delete(name: string): void;
};

export function hasRecoveryGrant(cookieStore: CookieReader): boolean {
  return cookieStore.get(RECOVERY_GRANT_COOKIE)?.value === GRANT_VALUE;
}

export function setRecoveryGrantCookie(cookieStore: CookieWriter): void {
  cookieStore.set(RECOVERY_GRANT_COOKIE, GRANT_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GRANT_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearRecoveryGrantCookie(cookieStore: CookieWriter): void {
  cookieStore.delete(RECOVERY_GRANT_COOKIE);
}
