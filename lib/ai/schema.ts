import { z } from "zod";
import { CONFIDENCE_LEVELS, RISK_FLAGS } from "../constants";

/**
 * Strict Output Structure ตาม Workshop 3
 * ทุก required field ต้องครบทุกครั้ง — validate ด้วย Zod ก่อนบันทึก (hallucination gatekeeping)
 */
export const TagOutputSchema = z.object({
  tags: z.array(z.string()).min(1, "ต้องมีอย่างน้อย 1 แท็ก"),
  answer_summary: z
    .string()
    .min(1, "answer_summary ห้ามว่าง")
    .refine(
      (s) => s.split(/[.!?。]/).filter((x) => x.trim()).length <= 3,
      "answer_summary ต้องไม่เกิน 3 ประโยค (WS3)"
    ),
  evidence_list: z
    .array(
      z.object({
        source: z.string().min(1),
        section: z.string().default(""),
        version: z.string().default(""),
      })
    )
    .min(1, "ต้องระบุ evidence อย่างน้อย 1 รายการ (WS3)"),
  assumptions: z.string().default(""),
  confidence_level: z.enum(CONFIDENCE_LEVELS),
  confidence_score: z.number().min(0).max(1),
  risk_flag: z.enum(RISK_FLAGS).default("none"),
});

export type TagOutput = z.infer<typeof TagOutputSchema>;

/** map คะแนน → ระดับความมั่นใจ (WS3) */
export function scoreToLevel(score: number): TagOutput["confidence_level"] {
  if (score >= 0.75) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}
