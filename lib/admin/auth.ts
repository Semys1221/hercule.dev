import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "hercule_admin_session";

function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    throw new Error("ADMIN_SECRET is not set");
  }
  return secret;
}

export function getAdminSessionToken(): string {
  return createHmac("sha256", getAdminSecret())
    .update("hercule-admin-session-v1")
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminPassword(password: string): boolean {
  try {
    return safeEqual(password.trim(), getAdminSecret());
  } catch {
    return false;
  }
}

export function verifyAdminBearer(authorization: string | null): boolean {
  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }
  const token = authorization.slice("Bearer ".length).trim();
  try {
    return safeEqual(token, getAdminSecret());
  } catch {
    return false;
  }
}

export function verifyAdminSessionCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) {
    return false;
  }
  try {
    return safeEqual(cookieValue, getAdminSessionToken());
  } catch {
    return false;
  }
}

export function verifyAdminRequest(request: Request): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  if (verifyAdminBearer(request.headers.get("authorization"))) {
    return true;
  }
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_SESSION_COOKIE}=([^;]+)`),
  );
  const cookieValue = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return verifyAdminSessionCookie(cookieValue);
}

export function adminSessionCookieOptions(): {
  name: string;
  value: string;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: getAdminSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
