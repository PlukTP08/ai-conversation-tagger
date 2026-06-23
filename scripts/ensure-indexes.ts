/**
 * Ensure indexes: สร้าง/sync index ตาม schema เข้ากับ DB (ปลอดภัย ไม่ลบข้อมูล)
 * รันครั้งเดียวหลัง deploy หรือเมื่อเพิ่ม index ใหม่: npm run ensure-indexes
 *
 * จำเป็นเพราะ production ปิด autoIndex (lib/db.ts) เพื่อไม่ให้ cold start ช้า
 */
import "./loadenv"; // ต้องเป็นอันดับแรก — โหลด .env.local ก่อนโมดูลที่อ่าน env

import mongoose from "mongoose";
import { dbConnect } from "../lib/db";
import { Conversation } from "../lib/models/Conversation";
import { TagSuggestion } from "../lib/models/TagSuggestion";
import { AuditLog } from "../lib/models/AuditLog";
import { RulebookChunk } from "../lib/models/RulebookChunk";

async function main() {
  await dbConnect();
  const models = [Conversation, TagSuggestion, AuditLog, RulebookChunk] as const;
  for (const m of models) {
    await m.syncIndexes();
    console.log(`✓ indexes synced: ${m.modelName}`);
  }
  await mongoose.disconnect();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
