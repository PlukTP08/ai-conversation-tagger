import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { TagSuggestion } from "@/lib/models/TagSuggestion";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();
  const pendingCount = await TagSuggestion.countDocuments({
    status: { $in: ["refused"] },
  }).catch(() => 0);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar pendingCount={pendingCount} user={{ name: session.name, role: session.role }} />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
