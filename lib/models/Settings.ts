import mongoose, { Schema, type InferSchemaType } from "mongoose";
import {
  DEFAULT_CONFIDENCE_THRESHOLD,
  DEFAULT_REVIEW_SAMPLE_RATE,
  DEFAULT_TOP_K,
} from "../constants";

/** Singleton settings (WS4 Next action: ปรับ Top_K / chunk size / refusal threshold) */
const SettingsSchema = new Schema({
  key: { type: String, default: "global", unique: true },
  confidenceThreshold: { type: Number, default: DEFAULT_CONFIDENCE_THRESHOLD },
  topK: { type: Number, default: DEFAULT_TOP_K },
  reviewSampleRate: { type: Number, default: DEFAULT_REVIEW_SAMPLE_RATE },
  // metadata dictionary (WS4) — รายการฟิลด์ที่บังคับจัดเก็บ
  metadataFields: {
    type: [String],
    default: ["system", "agent_role", "project_name", "partner_type"],
  },
});

export type SettingsDoc = InferSchemaType<typeof SettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Settings =
  mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

export async function getSettings() {
  const existing = await Settings.findOne({ key: "global" }).lean();
  if (existing) return existing;
  const created = await Settings.create({ key: "global" });
  return created.toObject();
}
