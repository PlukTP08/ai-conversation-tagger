import { dbConnect } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { TagSuggestion } from "@/lib/models/TagSuggestion";
import { AuditLog } from "@/lib/models/AuditLog";
import { getSettings } from "@/lib/models/Settings";
import { Card, Stat, ConfidenceBadge, StatusBadge } from "@/components/ui";
import { plain } from "@/lib/serialize";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await dbConnect();
  const settings = await getSettings();

  const [totalChats, tagged, pending, suggestions, recentAudit] = await Promise.all([
    Conversation.countDocuments({}),
    TagSuggestion.countDocuments({ status: "approved" }),
    TagSuggestion.countDocuments({ status: { $in: ["refused", "suggested"] } }),
    TagSuggestion.find({}).lean(),
    AuditLog.find({}).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const dist = { high: 0, medium: 0, low: 0 };
  const riskCounts: Record<string, number> = {};
  for (const s of suggestions as unknown as { confidence_level: "high" | "medium" | "low"; risk_flag: string }[]) {
    dist[s.confidence_level]++;
    if (s.risk_flag !== "none") riskCounts[s.risk_flag] = (riskCounts[s.risk_flag] || 0) + 1;
  }
  const totalSug = suggestions.length || 1;
  const audit = plain(recentAudit) as { _id: string; action: string; actor: string; chatId: string; detail: string; createdAt: string }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-[30px]">แดชบอร์ด</h1>
        <p className="text-sm text-ink-500">
          ภาพรวมการติดแท็ก · refusal threshold = {settings.confidenceThreshold} · review sample ={" "}
          {(settings.reviewSampleRate * 100).toFixed(0)}%
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="บทสนทนาทั้งหมด" value={totalChats} hint="จาก LINE OA (mock)" />
        <Stat label="ติดแท็กแล้ว (approved)" value={tagged} />
        <Stat label="รอรีวิว" value={pending} hint="refused + suggested" />
        <Stat label="suggestion ทั้งหมด" value={suggestions.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-ink-900">การกระจายความมั่นใจ (confidence)</h2>
          <div className="space-y-3">
            {(["high", "medium", "low"] as const).map((lvl) => (
              <div key={lvl} className="flex items-center gap-3">
                <div className="w-20">
                  <ConfidenceBadge level={lvl} />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(dist[lvl] / totalSug) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-right text-sm text-ink-700">{dist[lvl]}</div>
              </div>
            ))}
          </div>

          <h3 className="mb-2 mt-6 text-sm font-semibold text-ink-700">Risk flags</h3>
          {Object.keys(riskCounts).length === 0 ? (
            <p className="text-sm text-ink-500">ไม่มี risk flag</p>
          ) : (
            <ul className="space-y-1 text-sm text-ink-700">
              {Object.entries(riskCounts).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span>⚠ {k}</span>
                  <span className="font-semibold">{v}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">กิจกรรมล่าสุด (Audit)</h2>
            <Link href="/audit" className="text-xs text-brand-600 hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <ul className="space-y-3">
            {audit.map((a) => (
              <li key={a._id} className="flex items-start gap-3 text-sm">
                <StatusBadge status={a.action.replace("tag_", "")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-ink-700">
                    <span className="font-medium">{a.actor}</span> · {a.chatId}
                  </div>
                  <div className="truncate text-xs text-ink-500">{a.detail}</div>
                </div>
                <time className="shrink-0 text-[11px] text-ink-500">
                  {new Date(a.createdAt).toLocaleString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </time>
              </li>
            ))}
            {audit.length === 0 && <li className="text-sm text-ink-500">ยังไม่มีกิจกรรม</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
