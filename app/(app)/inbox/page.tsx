import Link from "next/link";
import { dbConnect } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { TagSuggestion } from "@/lib/models/TagSuggestion";
import { Card, StatusBadge, Tag, EmptyState } from "@/components/ui";
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
  const convos = plain(
    await Conversation.find({}).sort({ lastMessageAt: -1 }).lean()
  ) as Convo[];

  const latestByChat = new Map<string, { tags: string[]; status: string }>();
  const sugs = await TagSuggestion.find({}).sort({ createdAt: -1 }).lean();
  for (const s of sugs as unknown as { chatId: string; tags: string[]; finalTags: string[]; status: string }[]) {
    if (!latestByChat.has(s.chatId)) {
      latestByChat.set(s.chatId, {
        tags: s.status === "approved" ? s.finalTags : s.tags,
        status: s.status,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-[30px]">กล่องแชต</h1>
        <p className="text-sm text-ink-500">บทสนทนาจาก LINE OA (ข้อมูล mock · PII ถูก mask แล้ว)</p>
      </div>

      {convos.length === 0 ? (
        <EmptyState>ยังไม่มีบทสนทนา — รัน <code>npm run seed</code> เพื่อใส่ข้อมูลตัวอย่าง</EmptyState>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-ink-100">
            {convos.map((c) => {
              const tagInfo = latestByChat.get(c.chatId);
              const last = c.messages[c.messages.length - 1];
              return (
                <li key={c.chatId}>
                  <Link
                    href={`/inbox/${c.chatId}`}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-ink-100/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
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
