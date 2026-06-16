"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ROLE_LABELS, type Role } from "@/lib/constants";

/** inline line icons (stroke 1.5, currentColor) — แทน custom SVG ของแบรนด์ */
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const p: Record<string, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    inbox: (
      <>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
      </>
    ),
    review: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4 12 14.01l-3-3" />
      </>
    ),
    rulebook: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
    audit: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {p[name]}
    </svg>
  );
}

const NAV = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: "dashboard", section: "หลัก" },
  { href: "/inbox", label: "กล่องแชต", icon: "inbox", section: "หลัก" },
  { href: "/review", label: "คิวรีวิว", icon: "review", section: "หลัก" },
  { href: "/rulebook", label: "Rulebook", icon: "rulebook", section: "ความรู้" },
  { href: "/audit", label: "Audit Log", icon: "audit", section: "ความรู้" },
  { href: "/settings", label: "ตั้งค่า", icon: "settings", section: "ระบบ" },
];

export function Sidebar({
  pendingCount = 0,
  user,
}: {
  pendingCount?: number;
  user?: { name: string; role: Role };
}) {
  const pathname = usePathname();
  const sections = [...new Set(NAV.map((n) => n.section))];

  return (
    <aside className="sticky top-4 m-4 flex h-[calc(100vh-2rem)] w-60 shrink-0 flex-col gap-1 self-start rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/[0.06]">
      {/* brand */}
      <div className="mb-2 flex items-center gap-2.5 border-b border-ink-100 px-1.5 pb-4">
        <Image src="/brand/logo-tag-line.svg" alt="" width={32} height={32} />
        <span className="font-num text-[17px] tracking-tight text-ink-700">
          <span className="font-normal">Taging </span>
          <span className="font-bold">Line</span>
        </span>
      </div>

      {/* nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section} className="flex flex-col gap-0.5">
            <div className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              {section}
            </div>
            {NAV.filter((n) => n.section === section).map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-brand-100 font-semibold text-brand-600"
                      : "font-medium text-ink-700 hover:bg-canvas"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon name={item.icon} />
                    {item.label}
                  </span>
                  {item.href === "/review" && pendingCount > 0 && (
                    <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* profile chip */}
      <div className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-canvas p-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 font-num text-sm font-semibold text-white">
          {(user?.name ?? "A").charAt(0)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <b className="truncate text-[13px] font-semibold text-ink-700">{user?.name ?? "Admin"}</b>
          <small className="text-[11px] text-ink-500">
            {user ? ROLE_LABELS[user.role] : "Admin"}
          </small>
        </div>
        <a href="/logout" title="ออกจากระบบ" className="flex p-1 text-ink-500 hover:text-ink-900">
          <Icon name="logout" size={16} />
        </a>
      </div>
    </aside>
  );
}
