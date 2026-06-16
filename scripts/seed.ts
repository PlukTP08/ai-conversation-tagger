/**
 * Seed: mock LINE OA chats + Rulebook + tag suggestions + audit log
 * รัน: npm run seed   (⚠️ ลบทุก collection ก่อน seed)
 */
import "./loadenv"; // ต้องเป็นอันดับแรก — โหลด .env.local ก่อนโมดูลที่อ่าน env

import { dbConnect } from "../lib/db";
import { User } from "../lib/models/User";
import { Conversation } from "../lib/models/Conversation";
import { TagSuggestion } from "../lib/models/TagSuggestion";
import { AuditLog } from "../lib/models/AuditLog";
import { RulebookChunk } from "../lib/models/RulebookChunk";
import { Settings } from "../lib/models/Settings";
import { ingestDocument } from "../lib/rag/ingest";
import { maskPII } from "../lib/pii";

const HOUR = 3600_000;
const now = Date.now();

const users = [
  { email: "admin@smilefokus.com", name: "Admin ใหญ่", role: "admin" },
  { email: "supervisor@smilefokus.com", name: "หัวหน้า สมหญิง", role: "supervisor" },
  { email: "sales@smilefokus.com", name: "Sales สมชาย", role: "sales_tier1" },
  { email: "ai@smilefokus.com", name: "AI Engineer", role: "ai_engineer" },
];

function mkConvo(o: {
  chatId: string;
  displayName: string;
  project_name?: string;
  accessLevel?: string;
  status?: string;
  ageHours?: number; // ความเก่าของแชต (ชั่วโมงที่แล้ว)
  msgs: [string, string][];
}) {
  const base = now - (o.ageHours ?? 1) * HOUR;
  const messages = o.msgs.map(([sender, rawText], i) => ({
    sender,
    rawText,
    maskedText: maskPII(rawText),
    timestamp: new Date(base + i * 60_000),
  }));
  return {
    chatId: o.chatId,
    lineUserId: maskPII(o.chatId),
    displayName: o.displayName,
    project_name: o.project_name ?? "",
    accessLevel: o.accessLevel ?? "internal",
    assignedAgent: "sales@smilefokus.com",
    status: o.status ?? "open",
    messages,
    lastMessageAt: messages[messages.length - 1].timestamp,
  };
}

const EV = {
  intent: { source: "Corporate Tagging Rulebook", section: "2.3 Intent Criteria", version: "3.0" },
  churn: { source: "Corporate Tagging Rulebook", section: "2.4 Churn & Renewal", version: "3.0" },
  partner: { source: "Corporate Tagging Rulebook", section: "3.1 Partner Handling", version: "3.0" },
  product: { source: "Corporate Tagging Rulebook", section: "4.2 Product Capability", version: "3.0" },
};

/** [conversation, suggestion?] — suggestion อาจไม่มี (แชตที่ยังไม่ถูกวิเคราะห์) */
type Seed = {
  convo: ReturnType<typeof mkConvo>;
  sug?: {
    tags: string[];
    answer_summary: string;
    evidence_list: { source: string; section: string; version: string }[];
    assumptions?: string;
    confidence_level: "high" | "medium" | "low";
    confidence_score: number;
    risk_flag?: "none" | "outdated_source" | "conflict_detected" | "restricted_access";
    status: "suggested" | "approved" | "rejected" | "refused";
    sampledForReview?: boolean;
    reviewedBy?: string;
    finalTags?: string[];
    generatedBy?: "gemini" | "mock";
  };
};

const data: Seed[] = [
  {
    convo: mkConvo({
      chatId: "LINEUser-4591",
      displayName: "คุณวิภา (PEA)",
      project_name: "PEA",
      status: "tagged",
      ageHours: 26,
      msgs: [
        ["customer", "สวัสดีค่ะ สนใจโปรแกรม smileCULTURE อยากได้ใบเสนอราคาค่ะ"],
        ["agent", "สวัสดีครับ รบกวนขอจำนวนผู้ใช้งานคร่าวๆ ได้ไหมครับ"],
        ["customer", "ประมาณ 200 คนค่ะ ติดต่อกลับเบอร์ 081-234-5678 หรืออีเมล wipa@pea.co.th"],
      ],
    }),
    sug: {
      tags: ["#Quotation"],
      answer_summary: "ลูกค้าขอใบเสนอราคาโปรแกรม smileCULTURE สำหรับ ~200 ผู้ใช้ ติดแท็ก #Quotation",
      evidence_list: [EV.intent],
      confidence_level: "high",
      confidence_score: 0.92,
      status: "approved",
      reviewedBy: "หัวหน้า สมหญิง",
      finalTags: ["#Quotation"],
      generatedBy: "gemini",
    },
  },
  {
    convo: mkConvo({
      chatId: "LINEUser-8842",
      displayName: "พาร์ตเนอร์ทักมา",
      status: "tagged",
      ageHours: 20,
      msgs: [
        ["customer", "พาร์ตเนอร์ครับ ขอราคาพิเศษหน่อย ปกติเราได้เงื่อนไขตัวแทนจำหน่าย"],
        ["agent", "รับทราบครับ"],
      ],
    }),
    sug: {
      tags: ["#PartnerDeal"],
      answer_summary: "พาร์ตเนอร์ขอราคาพิเศษตามเงื่อนไขตัวแทน ใช้เกณฑ์ Partner_SOP ติด #PartnerDeal",
      evidence_list: [EV.partner, EV.intent],
      assumptions: "ผู้ติดต่อเป็นพาร์ตเนอร์เดิมตามที่ระบุ",
      confidence_level: "high",
      confidence_score: 0.88,
      risk_flag: "conflict_detected",
      status: "approved",
      reviewedBy: "Admin ใหญ่",
      finalTags: ["#PartnerDeal"],
      generatedBy: "gemini",
    },
  },
  {
    convo: mkConvo({
      chatId: "LINEUser-6128",
      displayName: "คุณพิม",
      status: "tagged",
      ageHours: 14,
      msgs: [
        ["customer", "อยากต่ออายุแพ็กเกจรายปีของ smileCULTURE ครับ ต้องทำยังไง"],
        ["agent", "ได้เลยครับ เดี๋ยวส่งขั้นตอนต่ออายุให้นะครับ"],
      ],
    }),
    sug: {
      tags: ["#Renewal"],
      answer_summary: "ลูกค้าต้องการต่ออายุแพ็กเกจรายปี ติดแท็ก #Renewal และส่งต่อทีม Sales",
      evidence_list: [EV.churn],
      confidence_level: "high",
      confidence_score: 0.9,
      status: "approved",
      reviewedBy: "หัวหน้า สมหญิง",
      finalTags: ["#Renewal"],
      generatedBy: "gemini",
    },
  },
  {
    convo: mkConvo({
      chatId: "LINEUser-9001",
      displayName: "คุณมานี",
      status: "tagged",
      ageHours: 10,
      msgs: [
        ["customer", "โปรแกรมราคาเท่าไหร่คะ มีแพ็กเกจรายปีไหม"],
        ["agent", "มีครับ เดี๋ยวส่งให้นะครับ"],
      ],
    }),
    sug: {
      tags: ["#PriceInquiry"],
      answer_summary: "ลูกค้าถามราคาเบื้องต้นและแพ็กเกจรายปี ติดแท็ก #PriceInquiry",
      evidence_list: [EV.intent],
      confidence_level: "medium",
      confidence_score: 0.7,
      status: "suggested",
      generatedBy: "gemini",
    },
  },
  {
    convo: mkConvo({
      chatId: "LINEUser-3310",
      displayName: "คุณนภา (Siam Kubota)",
      project_name: "Siam Kubota",
      status: "tagged",
      ageHours: 8,
      msgs: [
        ["customer", "ระบบ smileCULTURE รองรับการผูกข้อมูลจาก Smart Ring ไหมคะ"],
        ["agent", "ขอตรวจสอบข้อมูลให้นะครับ"],
      ],
    }),
    sug: {
      tags: ["#ProductQuestion"],
      answer_summary: "ลูกค้าถามความสามารถเชื่อมต่อ Smart Ring ติดแท็ก #ProductQuestion ตรวจคู่มือก่อนตอบ",
      evidence_list: [EV.product],
      confidence_level: "medium",
      confidence_score: 0.66,
      status: "suggested",
      generatedBy: "gemini",
    },
  },
  {
    convo: mkConvo({
      chatId: "LINEUser-6012",
      displayName: "คุณกานต์",
      status: "pending_review",
      ageHours: 6,
      msgs: [
        ["customer", "ระบบล่มบ่อยมากช่วงนี้ ใช้งานไม่ได้เลย ไม่พอใจมากครับ"],
        ["agent", "ขออภัยอย่างสูงครับ เดี๋ยวทีมเทคนิคเร่งตรวจสอบให้นะครับ"],
      ],
    }),
    sug: {
      tags: ["#Complaint", "#TechnicalSupport"],
      answer_summary: "ลูกค้าร้องเรียนระบบล่มและใช้งานไม่ได้ ติดแท็ก #Complaint และ #TechnicalSupport",
      evidence_list: [EV.intent],
      confidence_level: "high",
      confidence_score: 0.85,
      status: "suggested",
      sampledForReview: true, // ถูกสุ่มตรวจ 5%
      generatedBy: "gemini",
    },
  },
  {
    convo: mkConvo({
      chatId: "LINEUser-6245",
      displayName: "คุณตูน",
      status: "tagged",
      ageHours: 5,
      msgs: [
        ["customer", "เพิ่งสมัครใช้งานครับ อยากให้ช่วยตั้งค่าเริ่มต้นและสอนใช้งานหน่อย"],
        ["agent", "ยินดีครับ เดี๋ยวนัดเวลา onboarding ให้นะครับ"],
      ],
    }),
    sug: {
      tags: ["#Onboarding"],
      answer_summary: "ลูกค้าใหม่ต้องการความช่วยเหลือตั้งค่าเริ่มต้นและสอนใช้งาน ติดแท็ก #Onboarding",
      evidence_list: [EV.intent],
      confidence_level: "medium",
      confidence_score: 0.64,
      status: "suggested",
      generatedBy: "gemini",
    },
  },
  {
    convo: mkConvo({
      chatId: "LINEUser-7720",
      displayName: "คุณสมชาย",
      status: "pending_review",
      ageHours: 4,
      msgs: [
        ["customer", "บริการดีมากประทับใจจนอยากเลิกใช้เจ้าเดิมเลย อยากย้ายมาใช้ของคุณ"],
        ["agent", "ขอบคุณมากครับ เดี๋ยวผมส่งรายละเอียดให้นะครับ"],
      ],
    }),
    sug: {
      tags: ["#Onboarding"],
      answer_summary: "ลูกค้าสนใจย้ายมาใช้บริการ แต่เจตนากำกวมระหว่างสนใจซื้อกับสอบถาม",
      evidence_list: [EV.churn],
      assumptions: "ตีความว่า 'เลิกใช้เจ้าเดิม' = ต้องการย้ายมาใช้ ไม่ใช่ churn ของเรา",
      confidence_level: "low",
      confidence_score: 0.35,
      status: "refused",
      generatedBy: "gemini",
    },
  },
  {
    convo: mkConvo({
      chatId: "LINEUser-6371",
      displayName: "คุณบี",
      status: "pending_review",
      ageHours: 3,
      msgs: [
        ["customer", "ล็อกอินไม่ได้ครับ ขึ้น error ตลอด"],
        ["agent", "รบกวนแจ้งอีเมลที่ใช้สมัครด้วยครับ"],
      ],
    }),
    sug: {
      tags: ["#TechnicalSupport"],
      answer_summary: "ลูกค้าล็อกอินไม่ได้ พบ error ติดแท็ก #TechnicalSupport",
      evidence_list: [EV.product],
      confidence_level: "low",
      confidence_score: 0.45,
      status: "refused",
      generatedBy: "gemini",
    },
  },
  {
    // เคสกำกวม — ไม่มีเจตนาชัด → refusal (WS2 Ambiguous/Missing)
    convo: mkConvo({
      chatId: "LINEUser-5500",
      displayName: "คุณเอ",
      status: "pending_review",
      ageHours: 2,
      msgs: [
        ["customer", "สวัสดีครับ"],
        ["agent", "สวัสดีครับ มีอะไรให้ช่วยไหมครับ"],
        ["customer", "พอดีอยากสอบถามนิดหน่อยครับ"],
      ],
    }),
    sug: {
      tags: ["#GeneralInquiry"],
      answer_summary: "ยังไม่ระบุเจตนาชัดเจน ข้อมูลไม่เพียงพอต่อการติดแท็ก",
      evidence_list: [EV.intent],
      assumptions: "ลูกค้ายังไม่บอกว่าต้องการสอบถามเรื่องใด",
      confidence_level: "low",
      confidence_score: 0.15,
      status: "refused",
      generatedBy: "gemini",
    },
  },
  {
    // แชตใหม่ที่ยังไม่ได้วิเคราะห์ (ไว้กดปุ่ม "ให้ AI เสนอแท็ก" เอง)
    convo: mkConvo({
      chatId: "LINEUser-6500",
      displayName: "คุณฝน",
      status: "open",
      ageHours: 1,
      msgs: [
        ["customer", "อยากทราบว่ามีโปรโมชันช่วงนี้ไหมคะ แล้วราคาเริ่มต้นเท่าไร"],
        ["agent", "มีครับ เดี๋ยวสรุปให้นะครับ"],
      ],
    }),
  },
];

const rulebook = {
  source: "Corporate Tagging Rulebook",
  version: "3.0",
  accessLevel: "internal" as const,
  effectiveDate: new Date("2026-01-01"),
  sections: [
    {
      section: "2.3 Intent Criteria",
      text: "เมื่อลูกค้าสอบถามราคาหรือขอใบเสนอราคาโปรแกรม smileCULTURE ให้ติดแท็ก #Quotation. หากเป็นการถามราคาเบื้องต้นโดยยังไม่ขอเอกสาร ให้ใช้ #PriceInquiry. การติดแท็กต้องอ้างอิงเวอร์ชันล่าสุดของ Rulebook เสมอ.",
    },
    {
      section: "2.4 Churn & Renewal",
      text: "หากลูกค้าแสดงความไม่พอใจหรือพูดถึงการเลิกใช้บริการ ให้ติดแท็ก #Churn-Risk. หากพูดถึงการต่ออายุหรือต่อสัญญา ให้ติดแท็ก #Renewal และส่งต่อให้ทีม Sales.",
    },
    {
      section: "3.1 Partner Handling",
      text: "กรณีพาร์ตเนอร์หรือตัวแทนจำหน่ายทักเข้ามาขอราคาพิเศษ ให้ใช้เกณฑ์ Partner_SOP ติดแท็ก #PartnerDeal ห้ามนำเกณฑ์ราคาทั่วไปมาผสม เพื่อกัน conflict ระหว่างกฎ.",
    },
    {
      section: "4.2 Product Capability",
      text: "คำถามเชิงความสามารถของผลิตภัณฑ์ เช่น การเชื่อมต่ออุปกรณ์ภายนอก ให้ติดแท็ก #ProductQuestion และตรวจสอบคู่มือการใช้งานก่อนตอบ หากไม่พบข้อมูลให้ปฏิเสธอย่างสุภาพ.",
    },
  ],
};

async function main() {
  await dbConnect();
  console.log("🔌 connected. clearing collections...");
  await Promise.all([
    User.deleteMany({}),
    Conversation.deleteMany({}),
    TagSuggestion.deleteMany({}),
    AuditLog.deleteMany({}),
    RulebookChunk.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  await User.insertMany(users);
  console.log(`👤 users: ${users.length}`);

  await Conversation.insertMany(data.map((d) => d.convo));
  console.log(`💬 conversations: ${data.length}`);

  // tag suggestions + audit logs
  const suggestions: Record<string, unknown>[] = [];
  const audits: Record<string, unknown>[] = [];
  for (const d of data) {
    if (!d.sug) continue;
    const createdAt = d.convo.lastMessageAt;
    suggestions.push({
      chatId: d.convo.chatId,
      tags: d.sug.tags,
      answer_summary: d.sug.answer_summary,
      evidence_list: d.sug.evidence_list,
      assumptions: d.sug.assumptions ?? "",
      confidence_level: d.sug.confidence_level,
      confidence_score: d.sug.confidence_score,
      risk_flag: d.sug.risk_flag ?? "none",
      status: d.sug.status,
      sampledForReview: d.sug.sampledForReview ?? false,
      reviewedBy: d.sug.reviewedBy ?? "",
      reviewedAt: d.sug.reviewedBy ? new Date(createdAt.getTime() + 30 * 60_000) : null,
      finalTags: d.sug.finalTags ?? [],
      generatedBy: d.sug.generatedBy ?? "gemini",
      createdAt,
      updatedAt: createdAt,
    });

    // audit: เสนอ/ปฏิเสธ โดยระบบ
    audits.push({
      action: d.sug.status === "refused" ? "tag_refused" : "tag_suggested",
      actor: "system",
      actorRole: "ai_engineer",
      chatId: d.convo.chatId,
      detail: `tags=${d.sug.tags.join(",")} score=${d.sug.confidence_score} flag=${d.sug.risk_flag ?? "none"}`,
      createdAt,
      updatedAt: createdAt,
    });
    // audit: อนุมัติโดยคน (ถ้ามี reviewer)
    if (d.sug.reviewedBy) {
      const reviewedAt = new Date(createdAt.getTime() + 30 * 60_000);
      audits.push({
        action: d.sug.status === "approved" ? "tag_approved" : "tag_rejected",
        actor: d.sug.reviewedBy,
        actorRole: "supervisor",
        chatId: d.convo.chatId,
        detail: `finalTags=${(d.sug.finalTags ?? []).join(",")}`,
        createdAt: reviewedAt,
        updatedAt: reviewedAt,
      });
    }
  }

  // timestamps:false เพื่อคง createdAt ที่กำหนดเอง (runtime รองรับ แต่ type ของ mongoose ยังไม่มี)
  // @ts-expect-error - insertMany timestamps option
  if (suggestions.length) await TagSuggestion.insertMany(suggestions, { timestamps: false });
  // @ts-expect-error - insertMany timestamps option
  if (audits.length) await AuditLog.insertMany(audits, { timestamps: false });
  console.log(`🏷️  tag suggestions: ${suggestions.length}  |  🧾 audit logs: ${audits.length}`);

  const n = await ingestDocument(rulebook);
  console.log(`📚 rulebook chunks ingested: ${n}`);

  await Settings.create({ key: "global" });
  console.log("⚙️  settings created");

  console.log("\n✅ seed done. ล็อกอินด้วยอีเมล:");
  users.forEach((u) => console.log(`   - ${u.email} (${u.role})`));

  await (await import("mongoose")).default.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ seed failed:", e);
  process.exit(1);
});
