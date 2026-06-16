import { getSettings } from "@/lib/models/Settings";
import { dbConnect } from "@/lib/db";
import { Card } from "@/components/ui";
import { SettingsForm } from "./SettingsForm";
import { hasGemini, hasLineSecret } from "@/lib/env";
import { plain } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await dbConnect();
  const settings = plain(await getSettings()) as {
    confidenceThreshold: number;
    topK: number;
    reviewSampleRate: number;
    metadataFields: string[];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-[30px]">ตั้งค่าระบบ</h1>
        <p className="text-sm text-ink-500">จัดการและตั้งค่าเกณฑ์การวิเคราะห์ของระบบ AI</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-ink-900">เกณฑ์การวิเคราะห์ & Fail-safe</h2>
          <SettingsForm initial={settings} />
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-ink-900">สถานะการเชื่อมต่อ</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-ink-700">Gemini API (tagging)</span>
                <StatusDot ok={hasGemini()} okLabel="เชื่อมต่อแล้ว" offLabel="โหมด mock" />
              </li>
              <li className="flex items-center justify-between">
                <span className="text-ink-700">Gemini (embeddings)</span>
                <StatusDot ok={hasGemini()} okLabel="เชื่อมต่อแล้ว" offLabel="pseudo-embedding" />
              </li>
              <li className="flex items-center justify-between">
                <span className="text-ink-700">LINE Messaging API</span>
                <StatusDot ok={hasLineSecret()} okLabel="เชื่อมต่อแล้ว" offLabel="โหมดข้อมูลจำลอง" />
              </li>
            </ul>
            <p className="mt-3 text-xs text-ink-500">
              ใส่ <code>GEMINI_API_KEY</code> ใน <code>.env.local</code> เพื่อสลับไปใช้ Gemini จริง
              (ใช้ key เดียวทั้ง tagging และ embeddings)
            </p>
          </Card>

          <Card>
            <h2 className="mb-1 font-semibold text-ink-900">Metadata Dictionary</h2>
            <p className="mb-3 text-xs text-ink-500">คุณสมบัติ (properties) ของ Rulebook ที่ระบบบังคับจัดเก็บ</p>
            <div className="flex flex-wrap gap-1.5">
              {settings.metadataFields.map((f) => (
                <code key={f} className="rounded bg-ink-100 px-2 py-1 text-xs text-ink-700">
                  {f}
                </code>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ ok, okLabel, offLabel }: { ok: boolean; okLabel: string; offLabel: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-ink-300"}`} />
      {ok ? okLabel : offLabel}
    </span>
  );
}
