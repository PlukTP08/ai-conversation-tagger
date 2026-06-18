"use client";

import { useState, useTransition } from "react";
import { suggestTagsAction, reviewTagAction } from "@/app/(app)/actions";
import { ConfidenceBadge, RiskBadge, Tag, Button, Icon } from "@/components/ui";
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
        <Button onClick={run} loading={pending} fullWidth>
          {!pending && <Icon name="sparkles" size={16} />}
          {pending ? "กำลังวิเคราะห์..." : "ให้ AI เสนอแท็ก"}
        </Button>
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
        <div className="flex gap-2.5 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
          <span className="mt-0.5 shrink-0">
            <Icon name="alert" size={16} />
          </span>
          <span>
            ความมั่นใจต่ำกว่าเกณฑ์ — ระบบ <b>ปฏิเสธอัตโนมัติ (refusal)</b> และส่งเข้าคิวรีวิว
            ต้องให้คนยืนยัน (WS2/WS4)
          </span>
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
        <ul className="space-y-1.5">
          {suggestion.evidence_list.map((e, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-lg bg-ink-100 px-2.5 py-2 text-xs text-ink-700"
            >
              <span className="mt-0.5 shrink-0 text-ink-400">
                <Icon name="file" size={13} />
              </span>
              <span>
                <b className="text-ink-900">{e.source}</b>
                {e.section && ` · ${e.section}`}
                {e.version && ` · v${e.version}`}
              </span>
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
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ring-1 ${
            suggestion.status === "approved"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
              : "bg-ink-100 text-ink-700 ring-ink-200"
          }`}
        >
          <Icon name={suggestion.status === "approved" ? "check" : "x"} size={16} />
          {suggestion.status === "approved" ? "ยืนยันแล้ว" : "ปฏิเสธแล้ว"} โดย {suggestion.reviewedBy}
        </div>
      ) : (
        <div className="flex gap-2 pt-1">
          <Button
            variant="success"
            fullWidth
            onClick={() => review("approve")}
            disabled={selected.length === 0}
            loading={pending}
          >
            <Icon name="check" size={16} />
            ยืนยันแท็ก
          </Button>
          <Button variant="outline" onClick={() => review("reject")} disabled={pending}>
            ปฏิเสธ
          </Button>
        </div>
      )}

      <Button variant="ghost" size="sm" fullWidth onClick={run} loading={pending} className="text-brand-600 hover:bg-brand-50">
        {!pending && <Icon name="refresh" size={14} />}
        วิเคราะห์ใหม่
      </Button>
    </div>
  );
}
