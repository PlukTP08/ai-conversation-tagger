import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { CONFIDENCE_LEVELS, RISK_FLAGS, TAG_STATUS } from "../constants";

const EvidenceSchema = new Schema(
  {
    source: { type: String, required: true }, // ชื่อไฟล์/เอกสาร
    section: { type: String, default: "" },
    version: { type: String, default: "" },
  },
  { _id: false }
);

/** โครงสร้างตรงตาม Output Schema ของ Workshop 3 */
const TagSuggestionSchema = new Schema(
  {
    chatId: { type: String, required: true, index: true },
    tags: { type: [String], default: [] },
    answer_summary: { type: String, required: true }, // WS3 required, <= 3 ประโยค
    evidence_list: { type: [EvidenceSchema], default: [] }, // WS3 required
    assumptions: { type: String, default: "" }, // WS3 conditional
    confidence_level: { type: String, enum: CONFIDENCE_LEVELS, required: true },
    confidence_score: { type: Number, required: true, min: 0, max: 1 },
    risk_flag: { type: String, enum: RISK_FLAGS, default: "none" },

    // human-in-the-loop
    status: { type: String, enum: TAG_STATUS, default: "suggested", index: true },
    sampledForReview: { type: Boolean, default: false }, // WS4 สุ่ม 5%
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    finalTags: { type: [String], default: [] }, // แท็กหลังแอดมินแก้/ยืนยัน

    generatedBy: { type: String, enum: ["gemini", "mock"], default: "mock" },
  },
  { timestamps: true }
);

export type TagSuggestionDoc = InferSchemaType<typeof TagSuggestionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TagSuggestion =
  mongoose.models.TagSuggestion || mongoose.model("TagSuggestion", TagSuggestionSchema);
