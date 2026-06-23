import Link from "next/link";
import { dbConnect } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { TagSuggestion } from "@/lib/models/TagSuggestion";
import { Card, StatusBadge, Tag, EmptyState, PageTitle } from "@/components/ui";
import { plain } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Convo = {
  chatId: string;
  displayName: string;
  project_name: string;
  status: string;
  lastMessageAt: string;
  messages: { sender: string; maskedText: string }[];
};

export default async function InboxPage() {
  await dbConnect();
  // query ขนานกัน + ดึงเฉพาะข้อความล่าสุด ($slice -1) และฟิลด์ที่ใช้ → ลด payload/latency
  // suggestions: ยุบเหลือ "อันล่าสุดต่อแชต" ที่ DB (1 doc/แชต) แทนการลากทั้ง collection มา dedupe ที่ app
  const [convosRaw, sugs] = await Promise.all([
    Conversation.find(
      {},
      { chatId: 1, displayName: 1, project_name: 1, status: 1, lastMessageAt: 1, messages: { $slice: -1 } }
    )
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .lean(),
    TagSuggestion.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$chatId",
          tags: { $first: "$tags" },
          finalTags: { $first: "$finalTags" },
          status: { $first: "$status" },
        },
      },
    ]),
  ]);
  const convos = plain(convosRaw) as Convo[];

  const latestByChat = new Map<string, { tags: string[]; status: string }>();
  for (const s of sugs as unknown as { _id: string; tags: string[]; finalTags: string[]; status: string }[]) {
    latestByChat.set(s._id, {
      tags: s.status === "approved" ? s.finalTags : s.tags,
      status: s.status,
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <PageTitle en="Live Chat" />
        <p className="text-sm text-ink-500">บทสนทนาจาก LINE OA</p>
      </div>

      {convos.length === 0 ? (
        <EmptyState title="ยังไม่มีบทสนทนา">
          รัน <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-700">npm run seed</code>{" "}
          เพื่อใส่ข้อมูลตัวอย่าง
        </EmptyState>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-ink-200">
            {convos.map((c) => {
              const tagInfo = latestByChat.get(c.chatId);
              const last = c.messages[c.messages.length - 1];
              return (
                <li key={c.chatId}>
                  <Link
                    href={`/inbox/${c.chatId}`}
                    className="flex items-center gap-4 px-5 py-4 transition duration-150 hover:bg-ink-100"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700 ring-1 ring-brand-100">
                      {c.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-900">{c.displayName}</span>
                        {c.project_name && (
                          <span className="text-[11px] text-ink-500">· {c.project_name}</span>
                        )}
                      </div>
                      <div className="truncate text-sm text-ink-500">
                        {last ? `${last.sender}: ${last.maskedText}` : "—"}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      {tagInfo?.tags?.map((t) => <Tag key={t}>{t}</Tag>)}
                      <StatusBadge status={tagInfo?.status ?? c.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
