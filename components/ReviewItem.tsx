"use client";

import { useTransition } from "react";
import Link from "next/link";
import { reviewTagAction } from "@/app/(app)/actions";
import { ConfidenceBadge, RiskBadge, Tag, StatusBadge } from "@/components/ui";
import { RISK_FLAG_LABELS, type RiskFlag } from "@/lib/constants";

export type ReviewRow = {
  _id: string;
  chatId: string;
  displayName: string;
  tags: string[];
  answer_summary: string;
  confidence_level: "high" | "medium" | "low";
  confidence_score: number;
  risk_flag: RiskFlag;
  status: string;
  sampledForReview: boolean;
  reason: string;
};

export function ReviewItem({ row }: { row: ReviewRow }) {
  const [pending, startTransition] = useTransition();

  function review(decision: "approve" | "reject") {
    startTransition(() => reviewTagAction(row._id, row.chatId, decision, row.tags));
  }

  return (
    <div className="rounded-xl bg-surface p-4 shadow-sm ring-1 ring-ink-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/inbox/${row.chatId}`}
            className="font-medium text-ink-900 hover:text-brand-600"
          >
            {row.displayName}
          </Link>
          <span className="ml-2 text-xs text-ink-500">{row.chatId}</span>
          <p className="mt-1 text-sm text-ink-700">{row.answer_summary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {row.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <ConfidenceBadge level={row.confidence_level} score={row.confidence_score} />
          <RiskBadge flag={row.risk_flag} label={RISK_FLAG_LABELS[row.risk_flag]} />
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
            {row.reason}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
        <StatusBadge status={row.status} />
        <div className="flex gap-2">
          <button
            onClick={() => review("approve")}
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            ✅ ยืนยัน
          </button>
          <button
            onClick={() => review("reject")}
            disabled={pending}
            className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-ink-300 transition hover:bg-ink-100 disabled:opacity-50"
          >
            ปฏิเสธ
          </button>
        </div>
      </div>
    </div>
  );
}
