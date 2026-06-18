import { dbConnect } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { TagSuggestion } from "@/lib/models/TagSuggestion";
import { AuditLog } from "@/lib/models/AuditLog";
import { getSettings } from "@/lib/models/Settings";
import { Card, Stat, ConfidenceBadge, StatusBadge, PageTitle, Tag } from "@/components/ui";
import { plain } from "@/lib/serialize";
import Link from "next/link";

export const dynamic = "force-dynamic";

/** แตก detail ของ audit log ("tags=#A,#B score=0.45 flag=none" / "finalTags=#A,#B") เป็นส่วนๆ เพื่อแสดงผลให้อ่านง่าย */
function parseAuditDetail(detail: string) {
  const tagsMatch = detail.match(/(?:finalTags|tags)=([^ ]+)/);
  const scoreMatch = detail.match(/score=([0-9.]+)/);
  return {
    tags: tagsMatch?.[1] ? tagsMatch[1].split(",").filter(Boolean) : [],
    score: scoreMatch ? Number(scoreMatch[1]) : undefined,
  };
}

/** เหตุผล + action ที่ต้องทำ ตาม action ของ audit */
function auditReason(action: string, score?: number): { reason: string; actionRequired?: string } {
  switch (action) {
    case "tag_refused":
      return {
        reason: `Low Confidence${score != null ? ` (${score.toFixed(2)})` : ""}`,
        actionRequired: "Human-in-the-loop validation",
      };
    case "tag_suggested":
      return { reason: "AI suggested — pending review" };
    case "tag_approved":
      return { reason: "Approved by reviewer" };
    case "tag_rejected":
      return { reason: "Rejected by reviewer" };
    default:
      return { reason: action.replace("tag_", "") };
  }
}

export default async function DashboardPage() {
  await dbConnect();
  const settings = await getSettings();

  const [totalChats, tagged, pending, confidenceRows, riskRows, totalSuggestions, recentAudit] = await Promise.all([
    Conversation.countDocuments({}),
    TagSuggestion.countDocuments({ status: "approved" }),
    TagSuggestion.countDocuments({ status: { $in: ["refused", "suggested"] } }),
    TagSuggestion.aggregate([{ $group: { _id: "$confidence_level", count: { $sum: 1 } } }]),
    TagSuggestion.aggregate([
      { $match: { risk_flag: { $ne: "none" } } },
      { $group: { _id: "$risk_flag", count: { $sum: 1 } } },
    ]),
    TagSuggestion.countDocuments({}),
    AuditLog.find({}).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const dist = { high: 0, medium: 0, low: 0 };
  const riskCounts: Record<string, number> = {};
  for (const row of confidenceRows as { _id: "high" | "medium" | "low"; count: number }[]) {
    if (row._id in dist) dist[row._id] = row.count;
  }
  for (const row of riskRows as { _id: string; count: number }[]) {
    riskCounts[row._id] = row.count;
  }
  const totalSug = totalSuggestions || 1;
  const automationRate = totalChats ? Math.round((totalSuggestions / totalChats) * 100) : 0;
  const audit = plain(recentAudit) as { _id: string; action: string; actor: string; chatId: string; detail: string; createdAt: string }[];

  return (
    <div className="space-y-6">
      <div>
        <PageTitle en="Dashboard" />
        <p className="text-sm text-ink-500">
          Real-time AI tagging overview and system audit logs · refusal threshold ={" "}
          {settings.confidenceThreshold} · review sample = {(settings.reviewSampleRate * 100).toFixed(0)}%
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label={<>บทสนทนาทั้งหมด <span className="text-ink-500">Total Chats</span></>}
          value={totalChats}
          hint="จาก LINE OA (mock)"
        />
        <Stat
          label={<>ติดแท็กแล้วโดย AI <span className="text-ink-500">Auto-Tagged</span></>}
          value={tagged}
          hint="approved"
        />
        <Stat
          label={<>รอรีวิว <span className="text-ink-500">Pending Review</span></>}
          value={pending}
          hint={`เคสที่ต่ำกว่าเกณฑ์ ${settings.confidenceThreshold}`}
        />
        <Stat
          label={<>อัตราอัตโนมัติ <span className="text-ink-500">Automation Rate</span></>}
          value={totalSuggestions}
          accent={`${automationRate}%`}
          hint="suggestion ทั้งหมด"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-ink-900">
            การกระจายความมั่นใจ <span className="font-normal text-ink-500">AI Confidence Distribution</span>
          </h2>
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
            <h2 className="font-semibold text-ink-900">
              กิจกรรมล่าสุด <span className="font-normal text-ink-500">Recent Activity</span>
            </h2>
            <Link href="/audit" className="text-xs text-brand-600 hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <ul className="space-y-3">
            {audit.map((a) => {
              const { tags, score } = parseAuditDetail(a.detail);
              const { reason, actionRequired } = auditReason(a.action, score);
              return (
                <li key={a._id} className="flex items-start gap-3 text-sm">
                  <StatusBadge status={a.action.replace("tag_", "")} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-ink-700">
                      <span className="font-medium">{a.actor}</span> · {a.chatId}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
                      {tags.length > 0 ? (
                        tags.map((t) => <Tag key={t}>{t}</Tag>)
                      ) : (
                        <span>—</span>
                      )}
                      <span className="text-ink-300">|</span>
                      <span>Reason: {reason}</span>
                    </div>
                    {actionRequired && (
                      <div className="mt-0.5 text-xs font-medium text-brand-600">
                        Action Required: {actionRequired}
                      </div>
                    )}
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
              );
            })}
            {audit.length === 0 && <li className="text-sm text-ink-500">ยังไม่มีกิจกรรม</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
