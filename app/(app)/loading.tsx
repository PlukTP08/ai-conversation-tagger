/** Skeleton แสดงทันทีระหว่างหน้า (force-dynamic) กำลังโหลดข้อมูลจาก server */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-ink-100" />
        <div className="h-4 w-72 rounded bg-ink-100" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-ink-100" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-ink-100" />
        <div className="h-64 rounded-2xl bg-ink-100" />
      </div>
    </div>
  );
}
