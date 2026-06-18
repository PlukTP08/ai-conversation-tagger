"use client";

import { useActionState } from "react";
import { ingestAction } from "./actions";
import { ACCESS_LEVELS } from "@/lib/constants";
import { Button } from "@/components/ui";

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
          className="h-11 rounded-lg border border-ink-300 bg-surface px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <input
          name="version"
          placeholder="version (เช่น 3.1)"
          className="h-11 rounded-lg border border-ink-300 bg-surface px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          name="section"
          placeholder="section (เช่น 2.3 Intent Criteria)"
          className="h-11 rounded-lg border border-ink-300 bg-surface px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <select
          name="accessLevel"
          defaultValue="internal"
          className="h-11 rounded-lg border border-ink-300 bg-surface px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
        className="w-full rounded-lg border border-ink-300 bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
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
        {pending ? "กำลัง ingest..." : "เพิ่ม / อัปเดตเวอร์ชัน"}
      </Button>
    </form>
  );
}
