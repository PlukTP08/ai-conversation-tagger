"use client";

import { useTransition } from "react";
import Link from "next/link";
import { reviewTagAction } from "@/app/(app)/actions";
import { ConfidenceBadge, RiskBadge, Tag, StatusBadge, Button, Icon } from "@/components/ui";
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
    <div className="rounded-2xl border border-ink-200 bg-surface p-4 shadow-sm transition duration-150 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/inbox/${row.chatId}`}
            className="font-semibold text-ink-900 transition hover:text-brand-600"
          >
            {row.displayName}
          </Link>
          <span className="ml-2 text-xs text-ink-400">{row.chatId}</span>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{row.answer_summary}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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

      <div className="mt-3.5 flex items-center justify-between border-t border-ink-200 pt-3.5">
        <StatusBadge status={row.status} />
        <div className="flex gap-2">
          <Button size="sm" variant="success" onClick={() => review("approve")} loading={pending}>
            <Icon name="check" size={14} />
            ยืนยัน
          </Button>
          <Button size="sm" variant="outline" onClick={() => review("reject")} disabled={pending}>
            ปฏิเสธ
          </Button>
        </div>
      </div>
    </div>
  );
}
