"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { ingestDocument } from "@/lib/rag/ingest";
import type { AccessLevel } from "@/lib/constants";

export async function ingestAction(_prev: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "unauthorized" };
  if (!["admin", "ai_engineer"].includes(session.role)) {
    return { error: "เฉพาะ Admin / AI Engineer เท่านั้นที่แก้ Rulebook ได้" };
  }

  const source = String(formData.get("source") || "").trim();
  const version = String(formData.get("version") || "").trim();
  const section = String(formData.get("section") || "").trim();
  const accessLevel = (String(formData.get("accessLevel") || "internal") as AccessLevel);
  const text = String(formData.get("text") || "").trim();

  if (!source || !version || !text) {
    return { error: "กรุณากรอก source, version และเนื้อหา" };
  }

  const n = await ingestDocument({
    source,
    version,
    accessLevel,
    sections: [{ section: section || "ทั่วไป", text }],
  });

  revalidatePath("/rulebook");
  return { ok: `เพิ่ม ${n} chunk ของ "${source}" v${version} สำเร็จ (เวอร์ชันเก่าถูก mark superseded)` };
}
