"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "./actions";
import { Button } from "@/components/ui";

export function SettingsForm({
  initial,
}: {
  initial: { confidenceThreshold: number; topK: number; reviewSampleRate: number };
}) {
  const [state, action, pending] = useActionState(
    saveSettingsAction,
    null as { error?: string; ok?: string } | null
  );

  return (
    <form action={action} className="max-w-md space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-900">
          เกณฑ์ความแม่นยำขั้นต่ำ (Confidence Score)
        </label>
        <input
          name="confidenceThreshold"
          type="number"
          step="0.05"
          min="0"
          max="1"
          defaultValue={initial.confidenceThreshold}
          className="h-11 w-full rounded-lg border border-ink-300 bg-surface px-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <p className="mt-1 text-xs text-ink-500">
          ถ้า AI มั่นใจต่ำกว่าค่านี้ ระบบจะปฏิเสธอัตโนมัติแล้วส่งข้อความเข้า “คิวรีวิว”
          ให้แอดมินช่วยตรวจทันที (ค่าแนะนำ = 0.6)
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-900">
          จำนวนข้อมูลอ้างอิงหลัก (Top_K)
        </label>
        <input
          name="topK"
          type="number"
          min="1"
          max="20"
          defaultValue={initial.topK}
          className="h-11 w-full rounded-lg border border-ink-300 bg-surface px-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <p className="mt-1 text-xs text-ink-500">
          จำนวนหัวข้อกฎเกณฑ์สูงสุดจาก Rulebook ที่จะดึงมาให้ AI ใช้ประกอบการวิเคราะห์
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-900">
          อัตราการสุ่มตรวจโดยแอดมิน (Review Sample Rate)
        </label>
        <div className="flex items-center gap-2">
          <input
            name="reviewSampleRate"
            type="number"
            step="1"
            min="0"
            max="100"
            defaultValue={Math.round(initial.reviewSampleRate * 100)}
            className="h-11 w-full rounded-lg border border-ink-300 bg-surface px-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <span className="text-base text-ink-500">%</span>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          ระบบจะสุ่มดักแชตที่ AI ติดแท็กผ่านแล้วตามสัดส่วนนี้ ส่งให้แอดมินรีวิวซ้ำเพื่อตรวจสอบความถูกต้อง
          (ค่าแนะนำ = 5%)
        </p>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100">
          {state.ok}
        </p>
      )}

      <Button type="submit" loading={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </Button>
    </form>
  );
}
