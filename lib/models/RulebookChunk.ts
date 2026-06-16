import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ACCESS_LEVELS } from "../constants";

/**
 * Chunk ของ Rulebook/เอกสาร พร้อม embedding และ metadata (WS1)
 * เก็บ embedding เป็น array — รองรับทั้ง Atlas Vector Search และ in-app cosine fallback
 */
const RulebookChunkSchema = new Schema(
  {
    source: { type: String, required: true }, // เช่น "Corporate Tagging Rulebook"
    section: { type: String, default: "" }, // เช่น "2.3 Intent Criteria"
    version: { type: String, required: true }, // เช่น "3.0" — ใช้ version ranking (WS2)
    effectiveDate: { type: Date, default: Date.now }, // WS4 context selection (Effective Date)
    accessLevel: {
      type: String,
      enum: Object.keys(ACCESS_LEVELS),
      default: "internal",
    },
    project_name: { type: String, default: "" }, // metadata layering (WS2 conflict)
    text: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    superseded: { type: Boolean, default: false }, // true = ถูกแทนที่ด้วยเวอร์ชันใหม่
  },
  { timestamps: true }
);

RulebookChunkSchema.index({ source: 1, version: 1 });

export type RulebookChunkDoc = InferSchemaType<typeof RulebookChunkSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RulebookChunk =
  mongoose.models.RulebookChunk || mongoose.model("RulebookChunk", RulebookChunkSchema);
