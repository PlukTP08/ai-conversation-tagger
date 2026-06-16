"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Settings } from "@/lib/models/Settings";

export async function saveSettingsAction(_prev: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "unauthorized" };
  if (!["admin", "supervisor", "ai_engineer", "product_owner"].includes(session.role)) {
    return { error: "ไม่มีสิทธิ์แก้ไขการตั้งค่า" };
  }

  const confidenceThreshold = Number(formData.get("confidenceThreshold"));
  const topK = Number(formData.get("topK"));
  const reviewSampleRate = Number(formData.get("reviewSampleRate")) / 100;

  if (confidenceThreshold < 0 || confidenceThreshold > 1) {
    return { error: "confidence threshold ต้องอยู่ระหว่าง 0–1" };
  }

  await dbConnect();
  await Settings.updateOne(
    { key: "global" },
    { $set: { confidenceThreshold, topK, reviewSampleRate } },
    { upsert: true }
  );

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: "บันทึกการตั้งค่าแล้ว" };
}
