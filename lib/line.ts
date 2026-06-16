import crypto from "node:crypto";
import { env } from "./env";

/**
 * ตรวจ X-Line-Signature ตามสเปก LINE Messaging API
 * signature = Base64( HMAC-SHA256(channelSecret, rawRequestBody) )
 */
export function verifyLineSignature(rawBody: string, signature: string | null): boolean {
  if (!env.lineChannelSecret) return false;
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", env.lineChannelSecret)
    .update(rawBody)
    .digest("base64");
  // เทียบแบบ constant-time กัน timing attack
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** ดึงชื่อโปรไฟล์ลูกค้าจาก LINE (ถ้ามี access token) — ไม่บังคับ */
export async function fetchLineDisplayName(userId: string): Promise<string | null> {
  if (!env.lineAccessToken) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${env.lineAccessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { displayName?: string };
    return data.displayName ?? null;
  } catch {
    return null;
  }
}

/** LINE webhook event types ที่เราสนใจ (subset) */
export type LineEvent = {
  type?: string;
  source?: { userId?: string; type?: string };
  message?: { type?: string; text?: string };
  timestamp?: number;
};
