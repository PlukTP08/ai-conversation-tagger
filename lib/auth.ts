import { cookies } from "next/headers";
import crypto from "node:crypto";
import { env } from "./env";
import type { Role } from "./constants";

const COOKIE = "sc_session";

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: Role;
};

function sign(payload: string): string {
  return crypto.createHmac("sha256", env.authSecret).update(payload).digest("base64url");
}

export function encodeSession(s: Session): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (sign(body) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session;
  } catch {
    return null;
  }
}

/** อ่าน session ปัจจุบันจากคุกกี้ (ใช้ใน server component / route handler) */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE)?.value);
}

export async function setSession(s: Session) {
  const store = await cookies();
  store.set(COOKIE, encodeSession(s), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
