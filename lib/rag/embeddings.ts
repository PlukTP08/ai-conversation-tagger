import { env, hasGemini } from "../env";

/**
 * สร้าง embedding ของข้อความ
 * - ถ้ามี GEMINI_API_KEY → เรียก Gemini embedContent จริง
 * - ถ้าไม่มี → fallback เป็น hash-based pseudo-embedding (deterministic) เพื่อให้ RAG flow รันได้
 */
const DIM = 256;
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export async function embed(texts: string[]): Promise<number[][]> {
  if (hasGemini()) {
    return embedGemini(texts);
  }
  return texts.map(pseudoEmbed);
}

export async function embedOne(text: string): Promise<number[]> {
  return (await embed([text]))[0];
}

async function embedGemini(texts: string[]): Promise<number[][]> {
  const model = `models/${env.geminiEmbedModel}`;
  // เรียก embedContent ทีละข้อความ (gemini-embedding-001 รองรับ embedContent แบบ single)
  return Promise.all(
    texts.map(async (t) => {
      const res = await fetch(`${GEMINI_BASE}/${model}:embedContent?key=${env.geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, content: { parts: [{ text: t }] } }),
      });
      if (!res.ok) {
        throw new Error(`Gemini embeddings failed: ${res.status} ${await res.text()}`);
      }
      const data = (await res.json()) as { embedding: { values: number[] } };
      return data.embedding.values;
    })
  );
}

/**
 * Pseudo-embedding แบบ bag-of-words hashing — ไม่ใช่ semantic จริง
 * แต่ deterministic และพอให้เดโม cosine similarity ทำงานได้โดยไม่ต้องมี API key
 */
function pseudoEmbed(text: string): number[] {
  const vec = new Array(DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s#]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % DIM;
    vec[idx] += 1;
  }
  // normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
