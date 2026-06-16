// ตั้ง secret ก่อน — ใช้ dynamic import ของ lib/line ในแต่ละ test เพื่อให้ env จับค่าทัน
process.env.LINE_CHANNEL_SECRET = "test_secret_123";

import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

test("verifyLineSignature: ยอมรับ signature ที่ถูกต้อง / ปฏิเสธที่ผิด", async () => {
  const { verifyLineSignature } = await import("../lib/line");
  const body = JSON.stringify({ events: [{ type: "message" }] });
  const good = crypto.createHmac("sha256", "test_secret_123").update(body).digest("base64");

  assert.equal(verifyLineSignature(body, good), true);
  assert.equal(verifyLineSignature(body, "tampered"), false);
  assert.equal(verifyLineSignature(body, null), false);
  // body ถูกแก้ → signature เดิมต้องใช้ไม่ได้
  assert.equal(verifyLineSignature(body + " ", good), false);
});
