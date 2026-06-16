import { dbConnect } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { requireSession, isResponse, ok } from "@/lib/api";
import { plain } from "@/lib/serialize";

/** GET /api/chats — รายการบทสนทนา (เรียงตามข้อความล่าสุด) */
export async function GET(req: Request) {
  const session = await requireSession();
  if (isResponse(session)) return session;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

  await dbConnect();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const convos = await Conversation.find(filter)
    .sort({ lastMessageAt: -1 })
    .limit(limit)
    .select("-messages.rawText") // ไม่คืนข้อความดิบ (PII) ผ่าน API
    .lean();

  return ok({ count: convos.length, data: plain(convos) });
}
