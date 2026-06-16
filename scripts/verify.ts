/** End-to-end verify ของ pipeline (รันหลัง seed): npm run seed && tsx scripts/verify.ts */
import "./loadenv"; // ต้องเป็นอันดับแรก — โหลด .env.local ก่อนโมดูลที่อ่าน env

import mongoose from "mongoose";
import { dbConnect } from "../lib/db";
import { runTaggingForChat, reviewTag } from "../lib/services/tagging";
import { retrieve } from "../lib/rag/retrieve";
import { TagSuggestion } from "../lib/models/TagSuggestion";
import { AuditLog } from "../lib/models/AuditLog";

async function main() {
  await dbConnect();

  console.log("\n=== WS1/WS2: retrieve + access filter + version ranking ===");
  const r1 = await retrieve("ลูกค้าขอใบเสนอราคา smileCULTURE", "sales_tier1", 4);
  console.log(`  sales_tier1 → ${r1.chunks.length} chunks, top=${r1.topScore.toFixed(2)}, conflict=${r1.conflict}`);
  console.log(`  top chunk: ${r1.chunks[0]?.source} ${r1.chunks[0]?.section} v${r1.chunks[0]?.version}`);

  console.log("\n=== WS3: tag ทุกบทสนทนา (schema-validated) ===");
  const chatIds = ["LINEUser-4591", "LINEUser-7720", "LINEUser-3310", "LINEUser-8842", "LINEUser-9001", "LINEUser-5500"];
  for (const id of chatIds) {
    const t = await runTaggingForChat(id, "ai_engineer");
    console.log(
      `  ${id}: tags=[${t.tags.join(",")}] conf=${t.confidence_level}(${t.confidence_score}) risk=${t.risk_flag} status=${t.status} by=${t.generatedBy}`
    );
  }

  console.log("\n=== WS2/WS4: fail-safe (refusal เมื่อ confidence < threshold) ===");
  const refused = await TagSuggestion.countDocuments({ status: "refused" });
  const suggested = await TagSuggestion.countDocuments({ status: "suggested" });
  console.log(`  refused=${refused}, suggested=${suggested}`);

  console.log("\n=== WS4: human-in-the-loop approve ===");
  const one = await TagSuggestion.findOne({ status: { $in: ["suggested", "refused"] } });
  if (one) {
    const approved = await reviewTag(String(one._id), "approve", { name: "หัวหน้า สมหญิง", role: "supervisor" }, one.tags);
    console.log(`  approved ${one.chatId} → finalTags=[${approved.finalTags.join(",")}] by ${approved.reviewedBy}`);
  }

  console.log("\n=== Audit trail ===");
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(5).lean();
  for (const l of logs as unknown as { action: string; actor: string; chatId: string }[]) {
    console.log(`  ${l.action} · ${l.actor} · ${l.chatId}`);
  }

  console.log("\n✅ verify เสร็จ");
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ verify failed:", e);
  process.exit(1);
});
