import { dbConnect } from "@/lib/db";
import { TagSuggestion } from "@/lib/models/TagSuggestion";
import { Conversation } from "@/lib/models/Conversation";
import { getSettings } from "@/lib/models/Settings";
import { ReviewItem, type ReviewRow } from "@/components/ReviewItem";
import { EmptyState, PageTitle } from "@/components/ui";
import { plain } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  await dbConnect();
  const settings = await getSettings();

  // คิวรีวิว = refused (confidence ต่ำ) + suggested ที่ถูกสุ่ม 5% (WS4 human review)
  const sugs = plain(
    await TagSuggestion.find({
      $or: [{ status: "refused" }, { status: "suggested", sampledForReview: true }],
    })
      .sort({ createdAt: -1 })
      .lean()
  ) as (Omit<ReviewRow, "displayName" | "reason"> & { sampledForReview: boolean })[];

  const convoMap = new Map<string, string>();
  const convos = await Conversation.find({}).select("chatId displayName").lean();
  for (const c of convos as unknown as { chatId: string; displayName: string }[]) {
    convoMap.set(c.chatId, c.displayName);
  }

  const rows: ReviewRow[] = sugs.map((s) => ({
    ...s,
    displayName: convoMap.get(s.chatId) ?? s.chatId,
    reason: s.status === "refused" ? "refusal · confidence ต่ำ" : "สุ่มตรวจ 5%",
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <PageTitle en="Review Queue" />
        <p className="text-sm text-ink-500">
          เคสที่ confidence &lt; {settings.confidenceThreshold} (refused) หรือถูกสุ่มตรวจ{" "}
          {(settings.reviewSampleRate * 100).toFixed(0)}% — ต้องให้คนยืนยัน
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="ไม่มีรายการรอรีวิว">
          เคสทั้งหมดได้รับการยืนยันแล้ว — ไม่มีงานค้างในคิวรีวิวตอนนี้
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <ReviewItem key={r._id} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}
