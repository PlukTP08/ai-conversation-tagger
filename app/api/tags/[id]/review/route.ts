import { requireSession, isResponse, ok, badRequest } from "@/lib/api";
import { reviewTag } from "@/lib/services/tagging";
import { plain } from "@/lib/serialize";

/** POST /api/tags/{id}/review — human-in-the-loop  body: { decision: "approve"|"reject", finalTags?: string[] } */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (isResponse(session)) return session;

  const { id } = await params;
  let body: { decision?: "approve" | "reject"; finalTags?: string[] };
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid json");
  }
  if (body.decision !== "approve" && body.decision !== "reject") {
    return badRequest('decision ต้องเป็น "approve" หรือ "reject"');
  }

  try {
    const result = await reviewTag(
      id,
      body.decision,
      { name: session.name, role: session.role },
      body.finalTags
    );
    return ok({ data: plain(result) });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "review failed");
  }
}
