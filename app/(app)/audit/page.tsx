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
    <div className="space-y-6">
      <div>
        <PageTitle en="Audit Logs" />
        <p className="text-sm text-ink-500">
          ประวัติการติดแท็ก/รีวิวทั้งหมด (WS4 Review Approval Dashboard Log)
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState>ยังไม่มีบันทึก</EmptyState>
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase text-ink-500">
                <th className="px-5 py-3 font-medium">เวลา</th>
                <th className="px-5 py-3 font-medium">action</th>
                <th className="px-5 py-3 font-medium">ผู้กระทำ</th>
                <th className="px-5 py-3 font-medium">chatId</th>
                <th className="px-5 py-3 font-medium">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-b border-ink-100 last:border-0">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-ink-500">
                    {new Date(r.createdAt).toLocaleString("th-TH")}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.action.replace("tag_", "")} />
                  </td>
                  <td className="px-5 py-3 text-ink-700">
                    {r.actor}
                    {r.actorRole && <span className="text-xs text-ink-500"> · {r.actorRole}</span>}
                  </td>
                  <td className="px-5 py-3 text-ink-700">{r.chatId || "—"}</td>
                  <td className="px-5 py-3 text-xs text-ink-500">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
