/**
 * Centralized environment access. ทุกค่าเป็น optional ยกเว้น MONGODB_URI
 * เพื่อให้ระบบรันได้ทั้งโหมด mock (ไม่มี API key) และโหมด production จริง
 *
 * ใช้ Google Gemini API key เดียวสำหรับทั้ง tagging (generateContent) และ embeddings (embedContent)
 */
export const env = {
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smileculture",

  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  geminiEmbedModel: process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001",

  authSecret: process.env.AUTH_SECRET || "dev-secret-change-me-in-production",

  // LINE Messaging API
  lineChannelSecret: process.env.LINE_CHANNEL_SECRET || "",
  lineAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  // auto-trigger tagging เมื่อมีข้อความใหม่จาก LINE ("1"/"true" = เปิด)
  lineAutoTag: ["1", "true", "yes"].includes((process.env.LINE_AUTO_TAG || "").toLowerCase()),
};

/** มี Gemini API key หรือไม่ — ถ้าไม่มีจะ fallback เป็น mock tagger + pseudo-embedding */
export const hasGemini = () => env.geminiApiKey.length > 0;

/** ตั้งค่า LINE channel secret แล้วหรือยัง — ถ้าตั้งแล้วจะบังคับตรวจ signature */
export const hasLineSecret = () => env.lineChannelSecret.length > 0;
