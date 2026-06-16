"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "./actions";

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
        <label className="mb-1 block text-base font-bold text-ink-700">
          เกณฑ์ความแม่นยำขั้นต่ำ (Confidence Score)
        </label>
        <input
          name="confidenceThreshold"
          type="number"
          step="0.05"
          min="0"
          max="1"
          defaultValue={initial.confidenceThreshold}
          className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-base outline-none transition focus:border-brand-500 focus:ring-[3px] focus:ring-brand-100"
        />
        <p className="mt-1 text-xs text-ink-500">
          ถ้า AI มั่นใจต่ำกว่าค่านี้ ระบบจะปฏิเสธอัตโนมัติแล้วส่งข้อความเข้า “คิวรีวิว”
          ให้แอดมินช่วยตรวจทันที (ค่าแนะนำ = 0.6)
        </p>
      </div>

      <div>
        <label className="mb-1 block text-base font-bold text-ink-700">
          จำนวนข้อมูลอ้างอิงหลัก (Top_K)
        </label>
        <input
          name="topK"
          type="number"
          min="1"
          max="20"
          defaultValue={initial.topK}
          className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-base outline-none transition focus:border-brand-500 focus:ring-[3px] focus:ring-brand-100"
        />
        <p className="mt-1 text-xs text-ink-500">
          จำนวนหัวข้อกฎเกณฑ์สูงสุดจาก Rulebook ที่จะดึงมาให้ AI ใช้ประกอบการวิเคราะห์
        </p>
      </div>

      <div>
        <label className="mb-1 block text-base font-bold text-ink-700">
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
            className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-base outline-none transition focus:border-brand-500 focus:ring-[3px] focus:ring-brand-100"
          />
          <span className="text-base text-ink-500">%</span>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          ระบบจะสุ่มดักแชตที่ AI ติดแท็กผ่านแล้วตามสัดส่วนนี้ ส่งให้แอดมินรีวิวซ้ำเพื่อตรวจสอบความถูกต้อง
          (ค่าแนะนำ = 5%)
        </p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </button>
    </form>
  );
}
