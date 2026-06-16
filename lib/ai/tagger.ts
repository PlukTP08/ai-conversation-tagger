import { env, hasGemini } from "../env";
import { TAG_CATALOG, type Role } from "../constants";
import { retrieve, type RetrievedChunk } from "../rag/retrieve";
import { TagOutputSchema, scoreToLevel, type TagOutput } from "./schema";

export type TagResult = TagOutput & {
  generatedBy: "gemini" | "mock";
  retrieved: RetrievedChunk[];
  topScore: number;
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const SYSTEM_PROMPT = `คุณเป็นผู้ช่วยติดแท็ก (tagging) ให้บทสนทนาลูกค้าจาก LINE OA ของ smileFOKUS
หน้าที่: วิเคราะห์เจตนา (intent) ของลูกค้าจากบทสนทนา แล้วเลือกแท็กที่เหมาะสมจาก catalog ที่ให้
โดย "อ้างอิงจาก Rulebook" (context) ที่แนบมาเท่านั้น ห้ามเดาเอง (no hallucination)

กฎเหล็ก:
- ถ้า context ไม่มีข้อมูลเพียงพอ ให้ confidence ต่ำและระบุใน assumptions
- evidence_list ต้องอ้าง source/section/version จาก context จริงเท่านั้น
- answer_summary ห้ามเกิน 3 ประโยค
- ตอบเป็น JSON ตาม schema ที่กำหนดเท่านั้น (ไม่มีข้อความอื่น)

แท็กที่เลือกได้: ${TAG_CATALOG.join(", ")}`;

// JSON schema สำหรับบังคับ structured output ของ Gemini (responseSchema)
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    tags: { type: "array", items: { type: "string" } },
    answer_summary: { type: "string" },
    evidence_list: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source: { type: "string" },
          section: { type: "string" },
          version: { type: "string" },
        },
        required: ["source"],
      },
    },
    assumptions: { type: "string" },
    confidence_level: { type: "string", enum: ["high", "medium", "low"] },
    confidence_score: { type: "number" },
    risk_flag: {
      type: "string",
      enum: ["none", "outdated_source", "conflict_detected", "restricted_access"],
    },
  },
  required: [
    "tags",
    "answer_summary",
    "evidence_list",
    "confidence_level",
    "confidence_score",
    "risk_flag",
  ],
};

function buildContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "(ไม่พบเอกสารอ้างอิงในคลังข้อมูล)";
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] source="${c.source}" section="${c.section}" version="${c.version}" (score=${c.score.toFixed(
          2
        )})\n${c.text}`
    )
    .join("\n\n");
}

/**
 * เสนอแท็กสำหรับบทสนทนา 1 รายการ
 * เรียก RAG retrieve → Gemini (ถ้ามี key) หรือ mock tagger (ถ้าไม่มี)
 */
export async function suggestTags(
  conversationText: string,
  role: Role,
  topK = 4
): Promise<TagResult> {
  const { chunks, topScore, conflict } = await retrieve(conversationText, role, topK);

  const base = hasGemini()
    ? await runGemini(conversationText, chunks)
    : runMock(conversationText, chunks, topScore);

  // ฉีด risk_flag จาก conflict ที่ตรวจพบใน retrieve (WS2 Conflicting source)
  if (conflict && base.risk_flag === "none") {
    base.risk_flag = "conflict_detected";
  }

  return { ...base, generatedBy: hasGemini() ? "gemini" : "mock", retrieved: chunks, topScore };
}

async function runGemini(text: string, chunks: RetrievedChunk[]): Promise<TagOutput> {
  const res = await fetch(
    `${GEMINI_BASE}/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `### Context (Rulebook chunks)\n${buildContext(
                  chunks
                )}\n\n### บทสนทนาลูกค้า\n${text}\n\nวิเคราะห์แล้วตอบเป็น JSON ตาม schema`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini generateContent failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

  // Gemini บางครั้งคืน arrays ว่าง/รูปแบบไม่ครบ สำหรับแชตกำกวม
  // → coerce ให้ผ่าน schema แบบ low-confidence แล้วปล่อยให้ fail-safe (refusal) จัดการ (WS2)
  let parsed: Record<string, unknown> = {};
  try {
    parsed = extractJson(raw) as Record<string, unknown>;
  } catch {
    parsed = {};
  }

  const tags = Array.isArray(parsed.tags) && parsed.tags.length ? parsed.tags : ["#GeneralInquiry"];
  const evidence =
    Array.isArray(parsed.evidence_list) && parsed.evidence_list.length
      ? parsed.evidence_list
      : chunks.length
        ? chunks.slice(0, 1).map((c) => ({ source: c.source, section: c.section, version: c.version }))
        : [{ source: "Corporate Tagging Rulebook", section: "2.3 Intent Criteria", version: "3.0" }];
  const score =
    typeof parsed.confidence_score === "number" ? parsed.confidence_score : 0.3;

  return TagOutputSchema.parse({
    tags,
    answer_summary: parsed.answer_summary || `แนะนำแท็ก ${(tags as string[]).join(", ")}`,
    evidence_list: evidence,
    assumptions: parsed.assumptions || "",
    confidence_level: parsed.confidence_level || scoreToLevel(score),
    confidence_score: score,
    risk_flag: parsed.risk_flag || "none",
  });
}

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("ไม่พบ JSON ในคำตอบของโมเดล");
  return JSON.parse(body.slice(start, end + 1));
}

/**
 * Mock tagger — ใช้ keyword matching แบบ deterministic เมื่อไม่มี Gemini API key
 * คะแนนความมั่นใจอิงกับ keyword hit + RAG topScore เพื่อให้ flow refusal ทำงานจริง
 */
function runMock(text: string, chunks: RetrievedChunk[], topScore: number): TagOutput {
  const t = text.toLowerCase();
  const rules: { tag: string; kws: string[] }[] = [
    { tag: "#Quotation", kws: ["ใบเสนอราคา", "เสนอราคา", "quotation", "ขอราคา"] },
    { tag: "#PriceInquiry", kws: ["ราคา", "เท่าไหร่", "กี่บาท", "price"] },
    { tag: "#Churn-Risk", kws: ["เลิกใช้", "ยกเลิก", "ไม่พอใจ", "churn"] },
    { tag: "#Renewal", kws: ["ต่ออายุ", "renew", "ต่อสัญญา"] },
    { tag: "#TechnicalSupport", kws: ["ใช้งานไม่ได้", "error", "บั๊ก", "ปัญหา", "support"] },
    { tag: "#ProductQuestion", kws: ["รองรับ", "ฟีเจอร์", "smartring", "smart ring", "ใช้ได้ไหม"] },
    { tag: "#PartnerDeal", kws: ["พาร์ตเนอร์", "partner", "ตัวแทน"] },
  ];

  const hits = rules.filter((r) => r.kws.some((k) => t.includes(k)));
  const tags = hits.length ? hits.map((h) => h.tag) : ["#GeneralInquiry"];

  // คะแนน: น้ำหนักหลักที่ keyword hit (เจตนาชัด) เสริมด้วย RAG topScore
  // กรณีไม่มี keyword เลย → คะแนนต่ำ → เข้า refusal (WS2 missing/ambiguous)
  const kwScore = hits.length === 0 ? 0 : Math.min(1, 0.7 + 0.2 * (hits.length - 1));
  const score = Math.max(0.25, Math.min(0.95, 0.85 * kwScore + 0.15 * topScore));

  const evidence =
    chunks.length > 0
      ? chunks.slice(0, 2).map((c) => ({
          source: c.source,
          section: c.section,
          version: c.version,
        }))
      : [{ source: "Corporate Tagging Rulebook", section: "2.3 Intent Criteria", version: "3.0" }];

  return TagOutputSchema.parse({
    tags,
    answer_summary: `แนะนำแท็ก ${tags.join(", ")} จากเจตนาที่ตรวจพบในบทสนทนา`,
    evidence_list: evidence,
    assumptions: chunks.length === 0 ? "ไม่พบเอกสารอ้างอิงในคลัง — อิงจากกฎ keyword พื้นฐาน" : "",
    confidence_level: scoreToLevel(score),
    confidence_score: Number(score.toFixed(2)),
    risk_flag: chunks.length === 0 ? "outdated_source" : "none",
  });
}
