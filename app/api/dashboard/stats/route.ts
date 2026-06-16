import { dbConnect } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { TagSuggestion } from "@/lib/models/TagSuggestion";
import { requireSession, isResponse, ok } from "@/lib/api";

/** GET /api/dashboard/stats — สรุปภาพรวมสำหรับ dashboard */
export async function GET() {
  const session = await requireSession();
  if (isResponse(session)) return session;

  await dbConnect();
  const [totalChats, approved, pending, suggestions] = await Promise.all([
    Conversation.countDocuments({}),
    TagSuggestion.countDocuments({ status: "approved" }),
    TagSuggestion.countDocuments({ status: { $in: ["refused", "suggested"] } }),
    TagSuggestion.find({}).select("confidence_level risk_flag").lean(),
  ]);

  const confidence = { high: 0, medium: 0, low: 0 };
  const riskFlags: Record<string, number> = {};
  for (const s of suggestions as unknown as { confidence_level: "high" | "medium" | "low"; risk_flag: string }[]) {
    confidence[s.confidence_level]++;
    if (s.risk_flag !== "none") riskFlags[s.risk_flag] = (riskFlags[s.risk_flag] || 0) + 1;
  }

  return ok({
    totalChats,
    approved,
    pendingReview: pending,
    totalSuggestions: suggestions.length,
    confidenceDistribution: confidence,
    riskFlags,
  });
}
