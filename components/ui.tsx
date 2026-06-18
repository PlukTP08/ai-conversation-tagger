import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ConfidenceLevel, RiskFlag, TagStatus } from "@/lib/constants";

/* =======================================================================
   Icons — inline line set (stroke 1.6, currentColor) · replaces emoji
   ======================================================================= */
const ICON_PATHS: Record<string, ReactNode> = {
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  alert: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </>
  ),
  sparkles: (
    <path d="M12 3l1.9 4.8L18.7 9.7l-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9L12 3zM19 14l.8 2.1 2.2.8-2.2.8L19 20l-.8-2.3-2.2-.8 2.2-.8L19 14z" />
  ),
  arrowRight: <path d="M5 12h14M13 5l7 7-7 7" />,
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  className = "",
}: {
  name: keyof typeof ICON_PATHS;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

/* =======================================================================
   Button — primary / secondary / outline / ghost / danger / success
   heights 40–44px · loading state · subtle motion
   ======================================================================= */
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white shadow-xs hover:bg-brand-600 active:bg-brand-700",
  success: "bg-success text-white shadow-xs hover:brightness-[0.95] active:brightness-90",
  danger: "bg-error text-white shadow-xs hover:brightness-[0.95] active:brightness-90",
  secondary: "bg-ink-100 text-ink-900 hover:bg-ink-200 active:bg-ink-300",
  outline: "bg-surface text-ink-700 ring-1 ring-ink-300 hover:bg-ink-100 active:bg-ink-200",
  ghost: "text-ink-700 hover:bg-ink-100 active:bg-ink-200",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-11 gap-2 px-5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-sm font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${
        BUTTON_VARIANTS[variant]
      } ${BUTTON_SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading && (
        <svg className="-ml-0.5 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

/* =======================================================================
   Surfaces
   ======================================================================= */
export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-ink-200 bg-surface p-5 shadow-sm ${
        hover ? "transition duration-150 hover:-translate-y-0.5 hover:shadow-md" : ""
      } ${className}`}
    >
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

/* =======================================================================
   Badges
   ======================================================================= */
const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-red-50 text-red-700 ring-red-200",
};

export function ConfidenceBadge({ level, score }: { level: ConfidenceLevel; score?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${CONFIDENCE_STYLES[level]}`}
    >
      {level.toUpperCase()}
      {typeof score === "number" && <span className="font-medium opacity-70">{score.toFixed(2)}</span>}
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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${RISK_STYLES[flag]}`}
    >
      <Icon name="alert" size={12} />
      {label}
    </span>
  );
}

const STATUS_META: Record<string, { label: string; dot: string; cls: string }> = {
  suggested: { label: "Suggested", dot: "bg-blue-500", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  approved: { label: "Approved", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Rejected", dot: "bg-ink-400", cls: "bg-ink-100 text-ink-500 ring-ink-300" },
  refused: { label: "Refused", dot: "bg-red-500", cls: "bg-red-50 text-red-700 ring-red-200" },
  open: { label: "Open", dot: "bg-ink-400", cls: "bg-ink-100 text-ink-700 ring-ink-300" },
  tagged: { label: "Tagged", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending_review: { label: "Pending review", dot: "bg-amber-500", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  closed: { label: "Closed", dot: "bg-ink-400", cls: "bg-ink-100 text-ink-500 ring-ink-300" },
};

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${m.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/* =======================================================================
   Stat metric card
   ======================================================================= */
export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card hover className="flex flex-col gap-1">
      <div className="text-[13px] font-medium text-ink-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="stat-num text-[34px]">{value}</div>
        {accent && <span className="text-base font-semibold text-success">{accent}</span>}
      </div>
      {hint && <div className="text-xs text-ink-400">{hint}</div>}
    </Card>
  );
}

/* =======================================================================
   Page header
   ======================================================================= */
export function PageTitle({ en }: { en: string }) {
  return <h1 className="page-title text-[32px] leading-tight">{en}</h1>;
}

/* =======================================================================
   Sheet — one base white panel; sections split by hairline dividers
   (settings / detail pages). Section = label column + content column.
   ======================================================================= */
export function Sheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SheetSection({
  title,
  description,
  aside,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-x-10 gap-y-4 p-5 sm:grid-cols-3 sm:p-7">
      {(title || description) && (
        <div className="sm:col-span-1">
          <div className="flex items-center gap-2">
            {title && <h2 className="text-sm font-semibold text-ink-900">{title}</h2>}
            {aside}
          </div>
          {description && <p className="mt-1 text-xs leading-relaxed text-ink-500">{description}</p>}
        </div>
      )}
      <div className={title || description ? "sm:col-span-2" : "sm:col-span-3"}>{children}</div>
    </section>
  );
}

/* =======================================================================
   States
   ======================================================================= */
export function EmptyState({
  children,
  title,
  action,
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-300 bg-surface px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <Icon name="file" size={20} />
      </span>
      {title && <h3 className="text-base font-semibold text-ink-900">{title}</h3>}
      <div className="max-w-sm text-sm text-ink-500">{children}</div>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink-100 ${className}`} />;
}
