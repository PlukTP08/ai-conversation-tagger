import type { ReactNode } from "react";
import type { ConfidenceLevel, RiskFlag, TagStatus } from "@/lib/constants";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-black/[0.06] ${className}`}>
      {children}
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
      {children}
    </span>
  );
}

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-red-50 text-red-700 ring-red-200",
};

export function ConfidenceBadge({
  level,
  score,
}: {
  level: ConfidenceLevel;
  score?: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${CONFIDENCE_STYLES[level]}`}
    >
      {level.toUpperCase()}
      {typeof score === "number" && <span className="opacity-70">{score.toFixed(2)}</span>}
    </span>
  );
}

const RISK_STYLES: Record<RiskFlag, string> = {
  none: "bg-ink-100 text-ink-500 ring-ink-300",
  outdated_source: "bg-amber-50 text-amber-700 ring-amber-200",
  conflict_detected: "bg-red-50 text-red-700 ring-red-200",
  restricted_access: "bg-purple-50 text-purple-700 ring-purple-200",
};

export function RiskBadge({ flag, label }: { flag: RiskFlag; label: string }) {
  if (flag === "none") return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${RISK_STYLES[flag]}`}
    >
      ⚠ {label}
    </span>
  );
}

const STATUS_STYLES: Record<TagStatus | string, string> = {
  suggested: "bg-sky-50 text-sky-700 ring-sky-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-ink-100 text-ink-500 ring-ink-300",
  refused: "bg-red-50 text-red-700 ring-red-200",
  open: "bg-ink-100 text-ink-700 ring-ink-300",
  tagged: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending_review: "bg-amber-50 text-amber-700 ring-amber-200",
  closed: "bg-ink-100 text-ink-500 ring-ink-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
        STATUS_STYLES[status] ?? STATUS_STYLES.open
      }`}
    >
      {status}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <div className="text-sm text-ink-500">{label}</div>
      <div className="stat-num mt-2 text-[40px]">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-500">{hint}</div>}
    </Card>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-300 bg-surface/50 p-10 text-center text-sm text-ink-500">
      {children}
    </div>
  );
}
