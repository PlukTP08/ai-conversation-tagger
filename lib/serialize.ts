/** แปลง Mongoose lean/doc → plain object ที่ส่งข้าม server→client ได้ (ObjectId/Date → string) */
export function plain<T = unknown>(v: unknown): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
