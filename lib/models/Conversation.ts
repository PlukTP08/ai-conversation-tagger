import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ACCESS_LEVELS, CONVERSATION_STATUS } from "../constants";

const MessageSchema = new Schema(
  {
    sender: { type: String, enum: ["customer", "agent"], required: true },
    rawText: { type: String, required: true }, // ข้อความดิบ (มี PII) — ใช้ภายในเท่านั้น
    maskedText: { type: String, required: true }, // ข้อความหลัง PII masking — ใช้แสดง/ส่งเข้า LLM
    timestamp: { type: Date, required: true },
  },
  { _id: false }
);

const ConversationSchema = new Schema(
  {
    chatId: { type: String, required: true, unique: true }, // เช่น LINEUser-4591
    lineUserId: { type: String, required: true }, // masked แล้ว
    displayName: { type: String, required: true },
    assignedAgent: { type: String, default: "" },
    project_name: { type: String, default: "" }, // metadata layering (WS2 Ambiguous)
    partner_type: { type: String, default: "" }, // WS4 metadata dictionary
    accessLevel: {
      type: String,
      enum: Object.keys(ACCESS_LEVELS),
      default: "internal",
    },
    status: { type: String, enum: CONVERSATION_STATUS, default: "open" },
    messages: { type: [MessageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ status: 1, lastMessageAt: -1 });

export type ConversationDoc = InferSchemaType<typeof ConversationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Conversation =
  mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
