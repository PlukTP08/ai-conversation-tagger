"use client";

import { useActionState } from "react";
import { ingestAction } from "./actions";
import { ACCESS_LEVELS } from "@/lib/constants";

export function IngestForm() {
  const [state, action, pending] = useActionState(
    ingestAction,
    null as { error?: string; ok?: string } | null
  );

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          name="source"
          placeholder="source (เช่น Corporate Tagging Rulebook)"
          defaultValue="Corporate Tagging Rulebook"
          className="rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <input
          name="version"
          placeholder="version (เช่น 3.1)"
          className="rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          name="section"
          placeholder="section (เช่น 2.3 Intent Criteria)"
          className="rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <select
          name="accessLevel"
          defaultValue="internal"
          className="rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          {Object.keys(ACCESS_LEVELS).map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="text"
        rows={3}
        placeholder="เนื้อหากฎการติดแท็ก..."
        className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">{state.ok}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "กำลัง ingest..." : "+ เพิ่ม / อัปเดตเวอร์ชัน"}
      </button>
    </form>
  );
}
