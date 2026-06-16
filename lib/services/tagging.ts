import { dbConnect } from "../db";
import { Conversation } from "../models/Conversation";
import { TagSuggestion } from "../models/TagSuggestion";
import { AuditLog } from "../models/AuditLog";
import { getSettings } from "../models/Settings";
import { suggestTags } from "../ai/tagger";
import type { Role } from "../constants";

/**
 * รัน auto-tagging สำหรับบทสนทนา 1 รายการ แล้วบันทึกผล
 * ใช้ maskedText เท่านั้นในการส่งเข้าโมเดล (WS4 PII control)
 * Fail-safe (WS2/WS4):
 *  - confidence_score < threshold → status = "refused" (เข้า review queue)
 *  - มิฉะนั้น "suggested" และสุ่ม sampledForReview ตาม reviewSampleRate (WS4 5%)
 */
export async function runTaggingForChat(chatId: string, actorRole: Role = "ai_engineer") {
  await dbConnect();
  const convo = await Conversation.findOne({ chatId });
  if (!convo) throw new Error(`ไม่พบบทสนทนา chatId=${chatId}`);

  const settings = await getSettings();
  const conversationText = convo.messages
    .map((m: { sender: string; maskedText: string }) => `${m.sender}: ${m.maskedText}`)
    .join("\n");

  const result = await suggestTags(conversationText, actorRole, settings.topK);

  const refused = result.confidence_score < settings.confidenceThreshold;
  const sampled = !refused && Math.random() < settings.reviewSampleRate;
  const status = refused ? "refused" : "suggested";

  // หนึ่งบทสนทนามี suggestion ล่าสุดอันเดียว — ลบของเก่าที่ยังไม่ถูก review
  await TagSuggestion.deleteMany({ chatId, status: { $in: ["suggested", "refused"] } });

  const doc = await TagSuggestion.create({
    chatId,
    tags: result.tags,
    answer_summary: result.answer_summary,
    evidence_list: result.evidence_list,
    assumptions: result.assumptions,
    confidence_level: result.confidence_level,
    confidence_score: result.confidence_score,
    risk_flag: result.risk_flag,
    status,
    sampledForReview: sampled,
    generatedBy: result.generatedBy,
  });

  convo.status = refused || sampled ? "pending_review" : "tagged";
  await convo.save();

  await AuditLog.create({
    action: refused ? "tag_refused" : "tag_suggested",
    actor: "system",
    actorRole: "ai_engineer",
    chatId,
    targetId: String(doc._id),
    detail: `tags=${result.tags.join(",")} score=${result.confidence_score} flag=${result.risk_flag} by=${result.generatedBy}`,
    meta: { topScore: result.topScore, evidenceCount: result.evidence_list.length },
  });

  return doc.toObject();
}

/** ยืนยัน/ปฏิเสธแท็กโดยมนุษย์ (human-in-the-loop, WS4) */
export async function reviewTag(
  suggestionId: string,
  decision: "approve" | "reject",
  reviewer: { name: string; role: Role },
  finalTags?: string[]
) {
  await dbConnect();
  const sug = await TagSuggestion.findById(suggestionId);
  if (!sug) throw new Error("ไม่พบ tag suggestion");

  sug.status = decision === "approve" ? "approved" : "rejected";
  sug.reviewedBy = reviewer.name;
  sug.reviewedAt = new Date();
  sug.finalTags = decision === "approve" ? finalTags ?? sug.tags : [];
  await sug.save();

  const convo = await Conversation.findOne({ chatId: sug.chatId });
  if (convo) {
    convo.status = decision === "approve" ? "tagged" : "open";
    await convo.save();
  }

  await AuditLog.create({
    action: decision === "approve" ? "tag_approved" : "tag_rejected",
    actor: reviewer.name,
    actorRole: reviewer.role,
    chatId: sug.chatId,
    targetId: suggestionId,
    detail: `finalTags=${(sug.finalTags || []).join(",")}`,
  });

  return sug.toObject();
}
