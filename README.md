# smileCULTURE Admin — ระบบติด Tag แชต LINE OA

ระบบ auto-tagging บทสนทนาลูกค้าจาก LINE OA ด้วย **RAG + Google Gemini** พร้อม **human-in-the-loop**
สร้างตามกรอบ 4 workshops ใน `smilefokus_full_workshops.pdf`

- **WS1** Retrieval Design (RAG): retrieve + access filter ตาม role + version ranking
- **WS2** Fail-safe: refusal เมื่อ confidence ต่ำ, conflict detection, PII masking, access boundary
- **WS3** Output Schema: JSON ตายตัว (`answer_summary`, `evidence_list`, `assumptions`, `confidence_level`, `risk_flag`) ตรวจด้วย Zod
- **WS4** Controls: refusal threshold (0.6), human review สุ่ม 5%, audit log, dashboard, settings

## Tech stack
Next.js 15 (App Router) · TypeScript · Tailwind v4 · MongoDB + Mongoose · Google Gemini API · Zod

ระบบ **รันได้โดยไม่ต้องมี API key** — ถ้าไม่ใส่ `GEMINI_API_KEY` จะใช้ mock tagger
+ pseudo-embedding (in-app cosine) → flow ทำงานครบทุกขั้นตอน (Gemini ใช้ key เดียวทั้ง tagging และ embeddings)

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env.local      # แล้วแก้ค่าตามต้องการ
npm run seed                    # ใส่ข้อมูล mock (users, chats, rulebook) — ลบ collection เดิมก่อน
npm run dev                     # http://localhost:3000
```

ล็อกอินด้วยอีเมล (ไม่มีรหัสผ่าน — โหมด pilot): `admin@smilefokus.com`, `supervisor@smilefokus.com`,
`sales@smilefokus.com`, `ai@smilefokus.com`

## Environment (`.env.local`)
| ตัวแปร | ค่า | ผลถ้าไม่ใส่ |
|---|---|---|
| `MONGODB_URI` | local หรือ Atlas | จำเป็น |
| `GEMINI_API_KEY` | Google Gemini key (tagging + embeddings) | ใช้ mock + pseudo-embedding |
| `GEMINI_MODEL` | ดีฟอลต์ `gemini-2.5-flash` | — |
| `GEMINI_EMBED_MODEL` | ดีฟอลต์ `text-embedding-004` | — |
| `AUTH_SECRET` | secret เซ็นคุกกี้ | ใช้ค่า dev |

> ⚠️ `npm run seed` จะ **ลบทุก collection** ในฐานข้อมูลที่ชี้ไว้ก่อน seed —
> ระวังถ้าชี้ไป Atlas ที่มีข้อมูลจริง (พิจารณาใช้ db แยกเช่น `messageTag_dev`)

## คำสั่ง
| คำสั่ง | หน้าที่ |
|---|---|
| `npm run dev` / `build` / `start` | dev / production build / start |
| `npm run seed` | ใส่ข้อมูล mock |
| `npm test` | unit tests (PII masking, WS3 schema, chunk, cosine) |
| `npx tsx scripts/verify.ts` | ทดสอบ pipeline WS1–WS4 end-to-end (รันหลัง seed) |

## โครงสร้างหลัก
```
app/(auth)/login        เข้าสู่ระบบ (role-based)
app/(app)/dashboard     ภาพรวม + confidence distribution + risk flags (WS4)
app/(app)/inbox         กล่องแชต LINE → เปิดแชต → AI เสนอแท็ก → approve/edit/reject
app/(app)/review        คิวรีวิว (refused + สุ่ม 5%)
app/(app)/rulebook      จัดการเอกสาร + version ranking
app/(app)/audit         audit log
app/(app)/settings      threshold / Top_K / sample rate / สถานะการเชื่อมต่อ
app/api/webhook/line    LINE webhook (stub — พร้อมต่อของจริง)
lib/rag/*               ingest, retrieve, embeddings
lib/ai/*                schema (Zod, WS3) + tagger (Gemini / mock)
lib/services/tagging.ts fail-safe + refusal + human review + audit
lib/pii.ts              PII masking (WS4)
```

## REST API & Swagger

มี REST API พร้อมเอกสาร Swagger (OpenAPI 3.0):

| URL | คืออะไร |
|---|---|
| `/api-docs` | **Swagger UI** — ลองยิง API ได้ (login ก่อน แล้ว "Try it out" จะแนบ cookie ให้) |
| `/api/openapi` | OpenAPI 3.0 spec (JSON) |

Endpoints หลัก (ต้องมี session cookie ยกเว้น webhook):

| Method | Path | หน้าที่ |
|---|---|---|
| GET | `/api/chats` | รายการบทสนทนา (`?status=&limit=`) |
| GET | `/api/chats/{chatId}` | บทสนทนา + tag suggestion ล่าสุด |
| POST | `/api/tags/suggest` | สั่ง AI ติดแท็ก `{ "chatId": "..." }` |
| POST | `/api/tags/{id}/review` | ยืนยัน/ปฏิเสธ `{ "decision": "approve|reject", "finalTags": [] }` |
| GET | `/api/dashboard/stats` | สถิติภาพรวม |
| POST | `/api/webhook/line` | รับข้อความจาก LINE (ตรวจ signature) |

> หมายเหตุ: `rawText` (ข้อความดิบที่มี PII) ไม่ถูกส่งออกผ่าน API — คืนเฉพาะ `maskedText`

## เชื่อม LINE OA จริง (รับข้อความ → DB)

webhook พร้อมใช้งานแล้วที่ `POST /api/webhook/line` — รับ event จาก LINE → mask PII → เขียนลง DB
(ตรวจ `X-Line-Signature` อัตโนมัติเมื่อตั้ง secret; auto-tag ได้ด้วย)

1. ที่ [LINE Developers Console](https://developers.line.biz) → Messaging API channel → คัดลอก
   **Channel secret** และ **Channel access token**
2. ใส่ใน `.env.local`:
   ```
   LINE_CHANNEL_SECRET=xxxxx
   LINE_CHANNEL_ACCESS_TOKEN=xxxxx
   LINE_AUTO_TAG=1   # (ออปชัน) ให้ AI ติดแท็กอัตโนมัติเมื่อมีข้อความใหม่
   ```
3. เปิด public URL ให้ LINE ยิงเข้ามาได้:
   - dev: `ngrok http 3000` → ได้ URL `https://xxxx.ngrok.io`
   - prod: deploy (เช่น Vercel) แล้วใช้โดเมนจริง
4. ที่ LINE Console → ตั้ง **Webhook URL** = `https://<your-domain>/api/webhook/line` → กด **Verify** → เปิด **Use webhook**
5. ทักหา LINE OA → ข้อความจะถูกเขียนลง DB และเห็นในหน้า Inbox ทันที

> ทดสอบโลคัลโดยไม่ต้องมี LINE จริง: POST payload แบบ LINE เข้า `/api/webhook/line` ได้เลย
> (ถ้าไม่ตั้ง `LINE_CHANNEL_SECRET` ระบบจะข้ามการตรวจ signature สำหรับ dev)

## ขั้นต่อไป (ส่วนที่เหลือ)
1. **Figma:** ปรับ spacing/สี/typography ให้ตรง `smileCulture - Admin.fig` เมื่อได้รับ Figma link/Dev Mode
2. **CRM/SAP:** เชื่อมข้อมูลลูกค้าจริง (metadata รองรับไว้แล้ว)
3. **Atlas Vector Search:** เปลี่ยน `lib/rag/retrieve.ts` จาก in-app cosine เป็น `$vectorSearch` (สร้าง index บน Atlas)
