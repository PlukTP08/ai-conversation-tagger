import { test } from "node:test";
import assert from "node:assert/strict";
import { maskPII, containsPII } from "../lib/pii";
import { TagOutputSchema, scoreToLevel } from "../lib/ai/schema";
import { chunkText } from "../lib/rag/ingest";
import { cosineSimilarity } from "../lib/rag/embeddings";

test("maskPII ปกปิด email / เบอร์ / เลขบัตร", () => {
  assert.equal(maskPII("ติดต่อ wipa@pea.co.th"), "ติดต่อ [EMAIL]");
  assert.match(maskPII("โทร 081-234-5678"), /\[PHONE\]/);
  assert.match(maskPII("บัตร 1234567890123"), /\[(THAI_ID|ACCOUNT_NO)\]/);
  assert.equal(containsPII("ไม่มีอะไร"), false);
});

test("WS3 schema: answer_summary เกิน 3 ประโยค → fail", () => {
  const bad = {
    tags: ["#x"],
    answer_summary: "หนึ่ง. สอง. สาม. สี่.",
    evidence_list: [{ source: "a", section: "", version: "" }],
    confidence_level: "high",
    confidence_score: 0.9,
  };
  assert.throws(() => TagOutputSchema.parse(bad));
});

test("WS3 schema: evidence_list ว่าง → fail (required)", () => {
  const bad = {
    tags: ["#x"],
    answer_summary: "ok",
    evidence_list: [],
    confidence_level: "high",
    confidence_score: 0.9,
  };
  assert.throws(() => TagOutputSchema.parse(bad));
});

test("WS3 schema: valid object ผ่าน + default risk_flag = none", () => {
  const ok = TagOutputSchema.parse({
    tags: ["#Quotation"],
    answer_summary: "แนะนำแท็ก #Quotation",
    evidence_list: [{ source: "Rulebook", section: "2.3", version: "3.0" }],
    confidence_level: "high",
    confidence_score: 0.9,
  });
  assert.equal(ok.risk_flag, "none");
});

test("scoreToLevel แม็ปถูกต้อง", () => {
  assert.equal(scoreToLevel(0.8), "high");
  assert.equal(scoreToLevel(0.6), "medium");
  assert.equal(scoreToLevel(0.3), "low");
});

test("chunkText แบ่งข้อความยาว", () => {
  const long = "ประโยค. ".repeat(200);
  const chunks = chunkText(long, 200);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((c) => c.length <= 250));
});

test("cosineSimilarity", () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
});
