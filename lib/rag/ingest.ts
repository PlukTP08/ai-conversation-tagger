import { dbConnect } from "../db";
import { RulebookChunk } from "../models/RulebookChunk";
import { embed } from "./embeddings";
import type { AccessLevel } from "../constants";

export type IngestDoc = {
  source: string;
  version: string;
  effectiveDate?: Date;
  accessLevel?: AccessLevel;
  project_name?: string;
  sections: { section: string; text: string }[];
};

/** แบ่งข้อความยาวเป็น chunk ตามจำนวนตัวอักษรโดยประมาณ (รักษาขอบเขตประโยค) */
export function chunkText(text: string, maxChars = 600): string[] {
  const sentences = text.split(/(?<=[.!?。\n])\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).length > maxChars && cur) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur += (cur ? " " : "") + s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

/**
 * Ingest เอกสาร 1 เล่ม: chunk → embed → upsert
 * พร้อมทำ version ranking — mark chunk ของ source เดียวกันเวอร์ชันเก่าเป็น superseded (WS2)
 */
export async function ingestDocument(doc: IngestDoc) {
  await dbConnect();

  // mark เวอร์ชันเก่าของ source เดียวกันว่า superseded
  await RulebookChunk.updateMany(
    { source: doc.source, version: { $ne: doc.version } },
    { $set: { superseded: true } }
  );

  const rows: {
    section: string;
    text: string;
  }[] = [];
  for (const sec of doc.sections) {
    for (const c of chunkText(sec.text)) {
      rows.push({ section: sec.section, text: c });
    }
  }

  const embeddings = await embed(rows.map((r) => r.text));

  const docs = rows.map((r, i) => ({
    source: doc.source,
    section: r.section,
    version: doc.version,
    effectiveDate: doc.effectiveDate ?? new Date(),
    accessLevel: doc.accessLevel ?? "internal",
    project_name: doc.project_name ?? "",
    text: r.text,
    embedding: embeddings[i],
    superseded: false,
  }));

  // ลบ chunk เวอร์ชันเดียวกันเดิมก่อน (idempotent re-ingest)
  await RulebookChunk.deleteMany({ source: doc.source, version: doc.version });
  await RulebookChunk.insertMany(docs);

  return docs.length;
}
