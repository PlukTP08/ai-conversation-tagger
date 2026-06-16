import { requireSession, isResponse, ok, badRequest } from "@/lib/api";
import { runTaggingForChat } from "@/lib/services/tagging";
import { plain } from "@/lib/serialize";

/** POST /api/tags/suggest — สั่ง AI ติดแท็กให้บทสนทนา (RAG + Gemini)  body: { chatId } */
export async function POST(req: Request) {
  const session = await requireSession();
  if (isResponse(session)) return session;

  let body: { chatId?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid json");
  }
  if (!body.chatId) return badRequest("ต้องระบุ chatId");

  try {
    const result = await runTaggingForChat(body.chatId, session.role);
    return ok({ data: plain(result) }, 201);
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "tagging failed");
  }
}
