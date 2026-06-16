import { dbConnect } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { TagSuggestion } from "@/lib/models/TagSuggestion";
import { requireSession, isResponse, ok } from "@/lib/api";
import { NextResponse } from "next/server";
import { plain } from "@/lib/serialize";

/** GET /api/chats/{chatId} — บทสนทนา 1 รายการ + tag suggestion ล่าสุด */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const session = await requireSession();
  if (isResponse(session)) return session;

  const { chatId } = await params;
  await dbConnect();

  const convo = await Conversation.findOne({ chatId }).select("-messages.rawText").lean();
  if (!convo) {
    return NextResponse.json({ error: "ไม่พบบทสนทนา" }, { status: 404 });
  }
  const suggestion = await TagSuggestion.findOne({ chatId }).sort({ createdAt: -1 }).lean();

  return ok({ conversation: plain(convo), suggestion: plain(suggestion) });
}
