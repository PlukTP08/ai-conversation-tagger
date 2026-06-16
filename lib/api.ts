import { NextResponse } from "next/server";
import { getSession, type Session } from "./auth";

/** ตรวจ session สำหรับ REST API — คืน session หรือ NextResponse 401 */
export async function requireSession(): Promise<Session | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized — ต้องล็อกอินก่อน" }, { status: 401 });
  }
  return session;
}

export function isResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
