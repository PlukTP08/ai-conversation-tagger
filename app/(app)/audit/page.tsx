import { dbConnect } from "@/lib/db";
import { AuditLog } from "@/lib/models/AuditLog";
import { Card, StatusBadge, EmptyState, PageTitle } from "@/components/ui";
import { plain } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Row = {
  _id: string;
  action: string;
  actor: string;
  actorRole: string;
  chatId: string;
  detail: string;
  createdAt: string;
};

export default async function AuditPage() {
  await dbConnect();
  const rows = plain(
    await AuditLog.find({}).sort({ createdAt: -1 }).limit(200).lean()
  ) as Row[];

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <PageTitle en="Audit Logs" />
        <p className="text-sm text-ink-500">
          ประวัติการติดแท็ก/รีวิวทั้งหมด (WS4 Review Approval Dashboard Log)
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="ยังไม่มีบันทึก">เมื่อมีการติดแท็กหรือรีวิว รายการจะปรากฏที่นี่</EmptyState>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-100/60 text-left text-[11px] uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3 font-semibold">เวลา</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">ผู้กระทำ</th>
                  <th className="px-5 py-3 font-semibold">Chat ID</th>
                  <th className="px-5 py-3 font-semibold">รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-ink-200 transition last:border-0 hover:bg-ink-100/50"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-ink-500">
                      {new Date(r.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.action.replace("tag_", "")} />
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">
                      {r.actor}
                      {r.actorRole && <span className="text-xs text-ink-400"> · {r.actorRole}</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-ink-700">
                      {r.chatId || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink-500">{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
