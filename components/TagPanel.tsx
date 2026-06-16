"use client";

import { useState, useTransition } from "react";
import { suggestTagsAction, reviewTagAction } from "@/app/(app)/actions";
import { ConfidenceBadge, RiskBadge, Tag } from "@/components/ui";
import { TAG_CATALOG, RISK_FLAG_LABELS, type RiskFlag } from "@/lib/constants";

export type SuggestionView = {
  _id: string;
  tags: string[];
  finalTags: string[];
  answer_summary: string;
  evidence_list: { source: string; section: string; version: string }[];
  assumptions: string;
  confidence_level: "high" | "medium" | "low";
  confidence_score: number;
  risk_flag: RiskFlag;
  status: string;
  reviewedBy: string;
  generatedBy: string;
};

export function TagPanel({
  chatId,
  suggestion,
}: {
  chatId: string;
  suggestion: SuggestionView | null;
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(suggestion?.tags ?? []);

  function toggle(tag: string) {
    setSelected((s) => (s.includes(tag) ? s.filter((t) => t !== tag) : [...s, tag]));
  }

  function run() {
    startTransition(() => suggestTagsAction(chatId));
  }
  function review(decision: "approve" | "reject") {
    startTransition(() => reviewTagAction(suggestion!._id, chatId, decision, selected));
  }

  if (!suggestion) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-500">ยังไม่มีการเสนอแท็กสำหรับบทสนทนานี้</p>
        <button
          onClick={run}
          disabled={pending}
          className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "กำลังวิเคราะห์..." : "🤖 ให้ AI เสนอแท็ก"}
        </button>
      </div>
    );
  }

  const decided = suggestion.status === "approved" || suggestion.status === "rejected";
  const refused = suggestion.status === "refused";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ConfidenceBadge level={suggestion.confidence_level} score={suggestion.confidence_score} />
          <RiskBadge flag={suggestion.risk_flag} label={RISK_FLAG_LABELS[suggestion.risk_flag]} />
        </div>
        <span className="text-[11px] text-ink-500">by {suggestion.generatedBy}</span>
      </div>

      {refused && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠ ความมั่นใจต่ำกว่าเกณฑ์ — ระบบ <b>ปฏิเสธอัตโนมัติ (refusal)</b> และส่งเข้าคิวรีวิว
          ต้องให้คนยืนยัน (WS2/WS4)
        </div>
      )}

      <div>
        <div className="mb-1 text-xs font-semibold uppercase text-ink-500">answer_summary</div>
        <p className="text-sm text-ink-900">{suggestion.answer_summary}</p>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase text-ink-500">
          แท็ก {decided ? "(ผลสุดท้าย)" : "(เลือก/แก้ก่อนยืนยัน)"}
        </div>
        {decided ? (
          <div className="flex flex-wrap gap-1.5">
            {(suggestion.status === "approved" ? suggestion.finalTags : suggestion.tags).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {TAG_CATALOG.map((t) => {
              const on = selected.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggle(t)}
                  className={`rounded-md px-2 py-1 text-xs font-medium ring-1 transition ${
                    on
                      ? "bg-brand-500 text-white ring-brand-500"
                      : "bg-surface text-ink-700 ring-ink-300 hover:ring-brand-300"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="mb-1 text-xs font-semibold uppercase text-ink-500">
          evidence_list (อ้างอิง Rulebook)
        </div>
        <ul className="space-y-1">
          {suggestion.evidence_list.map((e, i) => (
            <li key={i} className="rounded-md bg-ink-100 px-2.5 py-1.5 text-xs text-ink-700">
              📄 <b>{e.source}</b>
              {e.section && ` · ${e.section}`}
              {e.version && ` · v${e.version}`}
            </li>
          ))}
        </ul>
      </div>

      {suggestion.assumptions && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-ink-500">assumptions</div>
          <p className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
            {suggestion.assumptions}
          </p>
        </div>
      )}

      {decided ? (
        <div className="rounded-lg bg-ink-100 px-3 py-2 text-sm text-ink-700">
          {suggestion.status === "approved" ? "✅ ยืนยันแล้ว" : "🚫 ปฏิเสธแล้ว"} โดย{" "}
          {suggestion.reviewedBy}
        </div>
      ) : (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => review("approve")}
            disabled={pending || selected.length === 0}
            className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            ✅ ยืนยันแท็ก
          </button>
          <button
            onClick={() => review("reject")}
            disabled={pending}
            className="rounded-lg bg-surface px-4 py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-ink-300 transition hover:bg-ink-100 disabled:opacity-50"
          >
            ปฏิเสธ
          </button>
        </div>
      )}

      <button
        onClick={run}
        disabled={pending}
        className="w-full rounded-lg py-2 text-xs font-medium text-brand-600 transition hover:bg-brand-50 disabled:opacity-50"
      >
        🔄 วิเคราะห์ใหม่
      </button>
    </div>
  );
}
