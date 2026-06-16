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
        <label className="mb-1 block text-sm font-medium text-ink-700">
          Refusal threshold (confidence ต่ำกว่านี้ → ปฏิเสธ + เข้ารีวิว)
        </label>
        <input
          name="confidenceThreshold"
          type="number"
          step="0.05"
          min="0"
          max="1"
          defaultValue={initial.confidenceThreshold}
          className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <p className="mt-1 text-xs text-ink-500">ค่าตาม WS4 = 0.6</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700">
          Top_K (จำนวน chunk ที่ดึงมาเป็น context)
        </label>
        <input
          name="topK"
          type="number"
          min="1"
          max="20"
          defaultValue={initial.topK}
          className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-700">
          Review sample rate (% สุ่มตรวจ human review)
        </label>
        <input
          name="reviewSampleRate"
          type="number"
          step="1"
          min="0"
          max="100"
          defaultValue={Math.round(initial.reviewSampleRate * 100)}
          className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <p className="mt-1 text-xs text-ink-500">ค่าตาม WS4 = 5%</p>
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
