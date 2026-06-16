import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { maskPII } from "@/lib/pii";
import { env, hasLineSecret } from "@/lib/env";
import { verifyLineSignature, fetchLineDisplayName, type LineEvent } from "@/lib/line";
import { runTaggingForChat } from "@/lib/services/tagging";

/**
 * LINE Messaging API webhook — รับข้อความจาก LINE OA → เขียนลง MongoDB
 *
 * ความปลอดภัย:
 *  - ถ้าตั้ง LINE_CHANNEL_SECRET → บังคับตรวจ X-Line-Signature (กันคนปลอม request)
 *  - ถ้ายังไม่ตั้ง (dev/mock) → อนุญาตผ่านเพื่อทดสอบ พร้อม log เตือน
 *
 * การทำงาน: แตก events[] → upsert Conversation + push message (mask PII ก่อนเก็บ)
 *  - ถ้ามี LINE_CHANNEL_ACCESS_TOKEN → ดึงชื่อโปรไฟล์ลูกค้า
 *  - ถ้า LINE_AUTO_TAG=1 → เรียก AI ติดแท็กอัตโนมัติหลังรับข้อความ
 */
export async function POST(req: Request) {
  // ต้องอ่าน raw body ก่อน เพื่อใช้คำนวณ signature
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  if (hasLineSecret()) {
    if (!verifyLineSignature(rawBody, signature)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[LINE webhook] LINE_CHANNEL_SECRET ยังไม่ตั้ง — ข้ามการตรวจ signature (dev mode)");
  }

  let body: { events?: LineEvent[] };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const events = body.events ?? [];
  if (!Array.isArray(events)) {
    return NextResponse.json({ error: "no events" }, { status: 400 });
  }

  await dbConnect();
  const touched = new Set<string>();
  let ingested = 0;

  for (const ev of events) {
    if (ev.type !== "message" || ev.message?.type !== "text" || !ev.message.text) continue;
    const userId = ev.source?.userId || "unknown";
    const chatId = `LINEUser-${userId.slice(-4)}`;
    const raw = ev.message.text;
    const ts = ev.timestamp ? new Date(ev.timestamp) : new Date();

    const displayName = (await fetchLineDisplayName(userId)) || chatId;

    await Conversation.updateOne(
      { chatId },
      {
        $setOnInsert: {
          chatId,
          lineUserId: maskPII(userId),
          displayName,
          status: "open",
          accessLevel: "internal",
        },
        $push: {
          messages: {
            sender: "customer",
            rawText: raw,
            maskedText: maskPII(raw),
            timestamp: ts,
          },
        },
        $set: { lastMessageAt: ts },
      },
      { upsert: true }
    );
    touched.add(chatId);
    ingested++;
  }

  // auto-tag (ออปชัน) — ไม่ให้ webhook ล้มถ้า tagging error
  if (env.lineAutoTag) {
    for (const chatId of touched) {
      try {
        await runTaggingForChat(chatId, "ai_engineer");
      } catch (e) {
        console.error(`[LINE webhook] auto-tag failed for ${chatId}:`, e);
      }
    }
  }

  // LINE คาดหวัง 200 เสมอเมื่อรับสำเร็จ
  return NextResponse.json({ ok: true, ingested, chats: [...touched] });
}

export async function GET() {
  return NextResponse.json({
    status: "LINE webhook พร้อมใช้งาน",
    signatureCheck: hasLineSecret() ? "enforced" : "disabled (set LINE_CHANNEL_SECRET)",
    autoTag: env.lineAutoTag,
  });
}
