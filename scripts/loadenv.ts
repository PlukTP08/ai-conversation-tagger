/**
 * โหลด .env.local ก่อนโมดูลอื่นถูก evaluate
 * ต้องเป็น import แรกสุดในสคริปต์ standalone (ESM evaluate imports ตามลำดับ source)
 * มิฉะนั้น lib/env จะอ่าน process.env ก่อนไฟล์ env ถูกโหลด → fallback เป็นค่า default
 */
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
else if (existsSync(".env")) process.loadEnvFile(".env");
