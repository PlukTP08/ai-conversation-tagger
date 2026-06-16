import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** Audit trail สำหรับ human review (WS4 Review Approval Dashboard Log) */
const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true }, // เช่น tag_suggested, tag_approved, tag_rejected
    actor: { type: String, required: true }, // อีเมล/ชื่อผู้กระทำ (หรือ "system")
    actorRole: { type: String, default: "" },
    chatId: { type: String, default: "" },
    targetId: { type: String, default: "" }, // id ของ TagSuggestion
    detail: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
