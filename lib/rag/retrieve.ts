import { dbConnect } from "../db";
import { RulebookChunk, type RulebookChunkDoc } from "../models/RulebookChunk";
import { embedOne, cosineSimilarity } from "./embeddings";
import { ACCESS_LEVELS, ROLE_MAX_ACCESS, type Role } from "../constants";

export type RetrievedChunk = {
  source: string;
  section: string;
  version: string;
  text: string;
  score: number;
  accessLevel: string;
  project_name: string;
};

export type RetrieveResult = {
  chunks: RetrievedChunk[];
  topScore: number;
  conflict: boolean; // WS2 Conflicting source — เจอ project_name ต่างกันใน top results
};

/**
 * Retrieve (WS1/WS2):
 *  1. embed query
 *  2. กรองด้วย accessLevel ของ role (WS4 access control / WS2 access boundary)
 *  3. ตัด chunk ที่ superseded ออก → version ranking ดึงเฉพาะเล่มล่าสุด (WS2 Normal case)
 *  4. จัดอันดับด้วย cosine similarity (in-app — รองรับ MongoDB local; Atlas อาจใช้ $vectorSearch)
 *  5. ตรวจ conflict จาก metadata layering (project_name ต่างกัน)
 */
export async function retrieve(
  query: string,
  role: Role,
  topK = 4
): Promise<RetrieveResult> {
  await dbConnect();

  const maxAccess = ACCESS_LEVELS[ROLE_MAX_ACCESS[role]];
  const allowedLevels = (Object.keys(ACCESS_LEVELS) as (keyof typeof ACCESS_LEVELS)[]).filter(
    (lvl) => ACCESS_LEVELS[lvl] <= maxAccess
  );

  const candidates = (await RulebookChunk.find({
    superseded: false,
    accessLevel: { $in: allowedLevels },
  }).lean()) as unknown as RulebookChunkDoc[];

  if (candidates.length === 0) {
    return { chunks: [], topScore: 0, conflict: false };
  }

  const qvec = await embedOne(query);

  const scored = candidates
    .map((c) => ({
      source: c.source,
      section: c.section,
      version: c.version,
      text: c.text,
      accessLevel: c.accessLevel,
      project_name: c.project_name || "",
      score: cosineSimilarity(qvec, c.embedding || []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const projects = new Set(
    scored.map((s) => s.project_name).filter((p) => p && p.length > 0)
  );

  return {
    chunks: scored,
    topScore: scored[0]?.score ?? 0,
    conflict: projects.size > 1,
  };
}
