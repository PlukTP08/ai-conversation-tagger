import { dbConnect } from "@/lib/db";
import { RulebookChunk } from "@/lib/models/RulebookChunk";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { IngestForm } from "./IngestForm";
import { plain } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Chunk = {
  _id: string;
  source: string;
  section: string;
  version: string;
  accessLevel: string;
  text: string;
  superseded: boolean;
};

export default async function RulebookPage() {
  await dbConnect();
  const chunks = plain(
    await RulebookChunk.find({}).sort({ source: 1, version: -1, section: 1 }).lean()
  ) as Chunk[];

  // group by source+version
  const groups = new Map<string, Chunk[]>();
  for (const c of chunks) {
    const key = `${c.source}__${c.version}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  return (
    <div className="space-y-6">
      <div>
        <PageTitle th="คู่มือการติดแท็ก" en="Tagging Rulebook" />
        <p className="text-sm text-ink-500">
          เอกสารอ้างอิงสำหรับ RAG · เวอร์ชันเก่าถูก mark superseded → retrieve ดึงเฉพาะเล่มล่าสุด (WS2)
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-ink-900">เพิ่ม / อัปเดตเอกสาร (ingest + embed)</h2>
        <IngestForm />
      </Card>

      {groups.size === 0 ? (
        <EmptyState>ยังไม่มีเอกสาร — รัน <code>npm run seed</code></EmptyState>
      ) : (
        <div className="space-y-4">
          {[...groups.entries()].map(([key, items]) => {
            const first = items[0];
            return (
              <Card key={key} className={first.superseded ? "opacity-60" : ""}>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="font-semibold text-ink-900">{first.source}</h3>
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    v{first.version}
                  </span>
                  <span className="text-xs text-ink-500">· access: {first.accessLevel}</span>
                  {first.superseded ? (
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] text-ink-500">
                      superseded (เก่า)
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                      active (ล่าสุด)
                    </span>
                  )}
                  <span className="ml-auto text-xs text-ink-500">{items.length} chunks</span>
                </div>
                <ul className="space-y-2">
                  {items.map((c) => (
                    <li key={c._id} className="rounded-lg bg-ink-100/60 px-3 py-2 text-sm">
                      <div className="text-xs font-medium text-brand-700">{c.section}</div>
                      <div className="text-ink-700">{c.text}</div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
