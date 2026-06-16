# LINE → API → DB : สเปกการเชื่อมต่อ (ส่งให้ผู้ดูแลฝั่ง LINE)

เอกสารนี้บอกว่า **LINE OA ต้องส่งอะไรมาที่ API ของเรา** เพื่อให้ข้อความถูกบันทึกลงฐานข้อมูล

---

## 1. ปลายทาง (Endpoint)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `https://<โดเมนของระบบ>/api/webhook/line` |
| **Content-Type** | `application/json` |

> ระบบนี้ใช้ **มาตรฐาน LINE Messaging API Webhook** — ถ้าตั้งค่าใน LINE Developers Console
> ตัว LINE จะ POST payload มาตรฐานมาให้เองอัตโนมัติ (ไม่ต้องเขียน payload เอง)

---

## 2. Headers ที่ต้องส่งมา

| Header | ค่า | จำเป็น |
|---|---|---|
| `Content-Type` | `application/json` | ✅ |
| `X-Line-Signature` | ลายเซ็น HMAC-SHA256 ของ **raw body** เข้ารหัส Base64 ด้วย **Channel Secret** | ✅ (ถ้าเปิดตรวจ signature) |

**วิธีคำนวณ signature** (LINE ทำให้อัตโนมัติ; ใส่ไว้เผื่อทำ integration เอง):
```
signature = Base64( HMAC-SHA256( channelSecret, rawRequestBody ) )
```
ระบบจะ **ปฏิเสธ (401)** ถ้า signature ไม่ตรง (เมื่อตั้ง `LINE_CHANNEL_SECRET` ไว้)

---

## 3. Body (payload) ที่ต้องส่ง

โครงสร้างตามมาตรฐาน LINE webhook — ระบบสนใจเฉพาะ event ที่เป็น **ข้อความตัวอักษร** (`message` + `text`)

### ตัวอย่างเต็ม
```json
{
  "destination": "Uxxxxxxxxxxxxxxxxxxxxxxxxx",
  "events": [
    {
      "type": "message",
      "timestamp": 1718500000000,
      "source": {
        "type": "user",
        "userId": "U1234567890abcdef1234567890abcdef"
      },
      "message": {
        "type": "text",
        "id": "499999999999999999",
        "text": "สนใจขอใบเสนอราคา smileCULTURE ครับ"
      },
      "replyToken": "0f3779fba3b349968c5d07db31eabf65"
    }
  ]
}
```

### ฟิลด์ที่ระบบ "ใช้จริง" เพื่อเขียน DB (จำเป็น)

| ฟิลด์ใน payload | ใช้ทำอะไร | จำเป็น |
|---|---|---|
| `events[].type` = `"message"` | กรองเฉพาะ event ข้อความ | ✅ |
| `events[].message.type` = `"text"` | รับเฉพาะข้อความตัวอักษร (รูป/สติกเกอร์ข้ามไป) | ✅ |
| `events[].message.text` | เนื้อหาข้อความ → เก็บลง DB (mask PII ก่อน) | ✅ |
| `events[].source.userId` | ระบุผู้ส่ง → ใช้สร้าง `chatId` | ✅ |
| `events[].timestamp` | เวลาข้อความ (ms) | ไม่บังคับ (ไม่ส่ง = ใช้เวลาปัจจุบัน) |

> event อื่น (image, sticker, follow, postback ฯลฯ) ระบบจะ **ข้าม** ไม่ error

---

## 4. ระบบทำอะไรกับข้อมูล

1. ตรวจ `X-Line-Signature` (ถ้าเปิด)
2. วน `events[]` เลือกเฉพาะ `message`/`text`
3. สร้าง `chatId = "LINEUser-" + 4 ตัวท้ายของ userId`
4. **Mask PII** (เบอร์โทร/อีเมล/เลขบัตร) ก่อนเก็บ
5. Upsert ลง collection `conversations` (สร้างใหม่ถ้ายังไม่มี, ต่อท้ายข้อความถ้ามีแล้ว)
6. (ออปชัน) ถ้าเปิด `LINE_AUTO_TAG` → เรียก AI ติดแท็กอัตโนมัติทันที

### ผลลัพธ์ที่ API ตอบกลับ
```json
{ "ok": true, "ingested": 1, "chats": ["LINEUser-cdef"] }
```
- สำเร็จ → `200`
- signature ผิด → `401`
- body ไม่ใช่ JSON → `400`

---

## 5. สิ่งที่ "คนทำฝั่ง LINE" ต้องเตรียม/ส่งให้เรา

> ฝั่ง LINE แทบไม่ต้องเขียนโค้ด — แค่ตั้งค่าใน Console แล้วส่ง credential ให้ทีมเรา

1. สร้าง **Messaging API channel** ใน [LINE Developers Console](https://developers.line.biz)
2. ส่งค่าต่อไปนี้ให้ทีมเรา (เอาไปใส่ `.env`):
   - **Channel secret** → `LINE_CHANNEL_SECRET` (ใช้ตรวจ signature)
   - **Channel access token (long-lived)** → `LINE_CHANNEL_ACCESS_TOKEN` (ใช้ดึงชื่อโปรไฟล์ลูกค้า, ไม่บังคับ)
3. ตั้ง **Webhook URL** = `https://<โดเมนของระบบ>/api/webhook/line`
4. กด **Verify** → เปิด **Use webhook = ON**
5. (แนะนำ) ปิด auto-reply/greeting ของ LINE OA ถ้าไม่ต้องการ

---

## 6. ทดสอบเร็ว (ไม่ต้องมี LINE จริง)

ยิง POST จำลองด้วย curl (กรณียังไม่ตั้ง secret = ข้ามตรวจ signature):
```bash
curl -X POST https://<โดเมน>/api/webhook/line \
  -H "Content-Type: application/json" \
  -d '{"events":[{"type":"message","source":{"userId":"Utest123456789"},"message":{"type":"text","text":"ทดสอบข้อความ"}}]}'
```
ควรได้ `{"ok":true,"ingested":1,...}` และเห็นแชตใหม่ในหน้า Inbox

ตรวจสถานะ webhook: `GET https://<โดเมน>/api/webhook/line`

---

## 7. หมายเหตุ

- โลคัล `localhost` LINE ยิงเข้าไม่ได้ — ต้อง deploy หรือเปิด tunnel (เช่น `ngrok http 3000`)
- ระบบเก็บข้อความ **หลัง mask PII** เป็นค่าหลักที่ใช้แสดง/ส่งเข้า AI; ข้อความดิบเก็บแยกและไม่ส่งออกผ่าน API
- โค้ดฝั่งรับอยู่ที่ `app/api/webhook/line/route.ts` + `lib/line.ts`
