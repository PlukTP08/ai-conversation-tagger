import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { TagSuggestion } from "@/lib/models/TagSuggestion";
import { Card, Icon } from "@/components/ui";
import { TagPanel, type SuggestionView } from "@/components/TagPanel";
import { plain } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  await dbConnect();

  // query ขนานกัน (เดิมรอทีละ query)
  const [convoRaw, sugRaw] = await Promise.all([
    Conversation.findOne({ chatId }).lean(),
    TagSuggestion.findOne({ chatId }).sort({ createdAt: -1 }).lean(),
  ]);

  const convo = plain(convoRaw) as {
    chatId: string;
    displayName: string;
    project_name: string;
    accessLevel: string;
    messages: { sender: string; maskedText: string; timestamp: string }[];
  } | null;
  if (!convo) notFound();

  const sug = plain(sugRaw) as SuggestionView | null;

  return (
    <div className="space-y-5">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <span className="rotate-180">
          <Icon name="arrowRight" size={15} />
        </span>
        กลับกล่องแชต
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* chat thread */}
        <Card className="flex flex-col">
          <div className="mb-4 flex items-center gap-3 border-b border-ink-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
              {convo.displayName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-ink-900">{convo.displayName}</div>
              <div className="text-xs text-ink-500">
                {convo.chatId}
                {convo.project_name && ` · project: ${convo.project_name}`} · access:{" "}
                {convo.accessLevel}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {convo.messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.sender === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.sender === "agent"
                      ? "bg-brand-500 text-white"
                      : "bg-ink-100 text-ink-900"
                  }`}
                >
                  {m.maskedText}
                  <div
                    className={`mt-0.5 text-[10px] ${
                      m.sender === "agent" ? "text-white/70" : "text-ink-400"
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-400">
            <Icon name="lock" size={12} />
            ข้อความถูก mask PII แล้ว (อีเมล/เบอร์/เลขบัตร) ก่อนแสดงและส่งเข้าโมเดล
          </p>
        </Card>

        {/* AI tag panel */}
        <div>
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink-900">
              <span className="text-brand-500">
                <Icon name="sparkles" size={18} />
              </span>
              ผลวิเคราะห์ &amp; ติดแท็ก (AI)
            </h2>
            <TagPanel chatId={chatId} suggestion={sug} />
          </Card>
        </div>
      </div>
    </div>
  );
}
