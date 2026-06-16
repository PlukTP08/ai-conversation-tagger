"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { runTaggingForChat, reviewTag } from "@/lib/services/tagging";

export async function suggestTagsAction(chatId: string) {
  const session = await getSession();
  if (!session) throw new Error("unauthorized");
  await runTaggingForChat(chatId, session.role);
  revalidatePath(`/inbox/${chatId}`);
  revalidatePath("/inbox");
  revalidatePath("/review");
  revalidatePath("/dashboard");
}

export async function reviewTagAction(
  suggestionId: string,
  chatId: string,
  decision: "approve" | "reject",
  finalTags?: string[]
) {
  const session = await getSession();
  if (!session) throw new Error("unauthorized");
  await reviewTag(suggestionId, decision, { name: session.name, role: session.role }, finalTags);
  revalidatePath(`/inbox/${chatId}`);
  revalidatePath("/inbox");
  revalidatePath("/review");
  revalidatePath("/audit");
  revalidatePath("/dashboard");
}
