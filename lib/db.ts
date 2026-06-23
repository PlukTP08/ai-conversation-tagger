import mongoose from "mongoose";
import { env } from "./env";

/**
 * Mongoose connection singleton — กัน hot-reload ของ Next.js สร้าง connection ซ้ำ
 */
type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { _mongoose?: Cached };

const cached: Cached = globalForMongoose._mongoose ?? { conn: null, promise: null };
globalForMongoose._mongoose = cached;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.mongoUri, {
        bufferCommands: false,
        // serverless: เลือก server เร็วขึ้น, จำกัด pool, ไม่ build index ซ้ำทุก cold start
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
        minPoolSize: 0,
        autoIndex: process.env.NODE_ENV !== "production",
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
