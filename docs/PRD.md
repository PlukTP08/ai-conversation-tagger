# PRD — ระบบ Auto-Tagging แชต LINE OA (smileCULTURE Admin)

| | |
|---|---|
| **ชื่อโปรเจกต์** | smileCULTURE Admin — LINE OA Chat & Journey Auto-Tagging |
| **เจ้าของเอกสาร** | smileFOKUS |
| **เวอร์ชัน** | 1.0 (Pilot) |
| **วันที่** | 2026-06-16 |
| **สถานะ** | Pilot Phase (อนุมัติ GO ตาม Workshop 4) |
| **อ้างอิง** | `smilefokus_full_workshops.pdf` (Workshop 1–4), ดีไซน์ `smileCulture - Admin.fig` |

---

## 1. ภาพรวม (Overview)

ระบบที่ช่วยทีม Sales/Support **ติดแท็กเจตนา (intent) และ journey ให้บทสนทนาลูกค้าจาก LINE OA โดยอัตโนมัติ**
ด้วยสถาปัตยกรรม RAG (Retrieval-Augmented Generation) + LLM (Google Gemini) ที่ "อ้างอิงกฎจาก Corporate
Tagging Rulebook" เสมอ และมี **human-in-the-loop** ให้แอดมิน/หัวหน้าทีมรีวิว ยืนยัน หรือแก้แท็กก่อนนำไปใช้จริง

หัวใจคือ **ความน่าเชื่อถือและตรวจสอบได้** — ทุกแท็กต้องมีหลักฐาน (evidence) อ้างอิงเอกสาร, มีระดับความมั่นใจ,
ปฏิเสธอัตโนมัติเมื่อไม่มั่นใจ, ปกปิด PII, และบันทึก audit ทุกการกระทำ

## 2. ปัญหา & เหตุผล (Problem & Why)

- ปัจจุบันการติดแท็กแชตทำด้วยมือ → ช้า ไม่สม่ำเสมอ ขึ้นกับวิจารณญาณรายบุคคล
- ปริมาณแชตสูง (โดยเฉพาะช่วง Peak Traffic) ทำให้ตกหล่นและจัดลำดับความสำคัญผิด
- ต้องการข้อมูล journey ที่เป็นมาตรฐานเพื่อส่งต่อให้ทีมที่ถูกต้องและทำรายงานเชิงกลยุทธ์
- ความเสี่ยง PDPA: แชตมีข้อมูลส่วนบุคคล (เบอร์/อีเมล/เลขบัตร) ที่ต้องถูกปกปิด
- ความเสี่ยง hallucination: ถ้าใช้ LLM ตรงๆ อาจติดแท็ก/ตอบโดยไม่มีหลักฐาน

**ผลลัพธ์ที่ต้องการ:** ติดแท็กเร็วขึ้น สม่ำเสมอ ตรวจสอบได้ พร้อมคุมความเสี่ยง (ความถูกต้อง + ความปลอดภัย)

## 3. ผู้ใช้และสิทธิ์ (Personas & Roles)

| Role | ใช้ทำอะไร | สิทธิ์เข้าถึงข้อมูล (access level) |
|---|---|---|
| **Admin** | ดูแลระบบ จัดการ Rulebook ตั้งค่า | restricted |
| **Supervisor** | รีวิว/อนุมัติแท็ก ดู dashboard | restricted |
| **Sales / Sales Tier-1** | ดูแชตที่รับผิดชอบ เสนอ/ยืนยันแท็ก (กลุ่ม Pilot) | internal |
| **AI Engineer** | จัดการ embedding/Rulebook ปรับพารามิเตอร์ retrieval | internal |
| **Security** | ตรวจ PII masking และ audit | restricted |
| **Product Owner** | กำหนดเกณฑ์ refusal / นโยบาย | internal |

> สิทธิ์ใช้คุมการ retrieve เอกสาร (เอกสาร restricted จะถูกกรองออกถ้า role ไม่ถึง) — Workshop 1/2/4

## 4. ขอบเขต (Scope)

### In scope (เฟส Pilot)
- เว็บแอดมิน (Next.js) ครบ 7 หน้าจอ: Login, Dashboard, Inbox, Conversation, Review queue, Rulebook, Audit, Settings
- RAG + LLM (Gemini) ติดแท็กพร้อม output schema ตายตัว (Workshop 3)
- Fail-safe: refusal, conflict detection, PII masking, access boundary (Workshop 2)
- Human-in-the-loop review + audit log + dashboard (Workshop 4)
- รองรับโหมด mock (ไม่มี API key → ทำงานได้ครบด้วย keyword tagger + pseudo-embedding)

### Out of scope (เฟสถัดไป)
- การเชื่อม LINE Messaging API จริง (มี **webhook stub** เตรียมไว้แล้ว → ปัจจุบันใช้ mock chat data)
- การตอบกลับลูกค้าอัตโนมัติ (auto-reply) — ระบบนี้ "ติดแท็ก" ไม่ "ตอบแทน"
- การเชื่อม CRM/SAP จริง (ออกแบบ metadata รองรับไว้แล้ว)
- Atlas Vector Search `$vectorSearch` (ปัจจุบันใช้ in-app cosine — สลับได้ภายหลัง)

## 5. ความต้องการเชิงฟังก์ชัน (Functional Requirements)

### 5.1 Retrieval / RAG (Workshop 1)
- **FR-1** ระบบดึง context จากคลังเอกสาร (Rulebook, ภายหลัง: LINE history, CRM/SAP) ตามความใกล้เคียง (similarity)
- **FR-2** กรองเอกสารตาม **access level** ของ role ผู้ใช้ก่อน retrieve
- **FR-3** ทำ **version ranking** — ดึงเฉพาะเอกสารเวอร์ชันล่าสุด (เวอร์ชันเก่า mark `superseded`)
- **FR-4** เก็บ metadata: source, section, version, effectiveDate, project_name, accessLevel

### 5.2 Tagging / Output (Workshop 3)
- **FR-5** LLM เสนอแท็กจาก catalog ที่กำหนด โดยอ้างอิง context เท่านั้น (ห้าม hallucinate)
- **FR-6** Output ต้องเป็น JSON ตายตัว ผ่าน schema validation (Zod) ทุกครั้ง:
  - `answer_summary` (≤ 3 ประโยค) · `evidence_list` [source/section/version] · `assumptions` (เมื่อกำกวม)
  - `confidence_level` (high/medium/low) · `confidence_score` (0–1) · `risk_flag`
- **FR-7** ถ้าโมเดลคืนค่าไม่ครบ/ว่าง → coerce เป็น low-confidence แล้วเข้าสู่ fail-safe (ไม่ error)

### 5.3 Fail-safe (Workshop 2)
- **FR-8 (Refusal)** ถ้า `confidence_score < threshold` (ดีฟอลต์ 0.6) → สถานะ `refused` → เข้าคิวรีวิว
- **FR-9 (Conflict)** ถ้า top results มาจากหลาย project/แหล่งที่ขัดแย้ง → `risk_flag = conflict_detected`
- **FR-10 (Missing)** ถ้าไม่พบเอกสารอ้างอิง → confidence ต่ำ + `risk_flag = outdated_source` + ระบุใน assumptions
- **FR-11 (Access boundary)** ปกปิด PII และกรองเอกสารเกินสิทธิ์ก่อนส่งเข้าโมเดล

### 5.4 Human-in-the-loop & Controls (Workshop 4)
- **FR-12** แอดมิน/หัวหน้าทีม **approve / แก้แท็ก / reject** ได้จากหน้า Conversation และ Review queue
- **FR-13** สุ่มตรวจ **5%** ของแท็กที่ผ่าน (sample for review) เพื่อ QA
- **FR-14** บันทึก **audit log** ทุก action (tag_suggested / refused / approved / rejected) พร้อมผู้กระทำ+เวลา
- **FR-15** Dashboard แสดง: จำนวนแชต, ติดแท็กแล้ว, รอรีวิว, การกระจาย confidence, risk flags, กิจกรรมล่าสุด
- **FR-16** Settings ปรับ: refusal threshold, Top_K, review sample rate, metadata dictionary

### 5.5 PII Masking (Workshop 4)
- **FR-17** Regex masking: อีเมล, เบอร์โทรไทย, เลขบัตรประชาชน, เลขบัญชี → แสดง/ส่งเข้าโมเดลเฉพาะข้อความที่ mask แล้ว
- **FR-18** เก็บข้อความดิบ (rawText) แยกจากข้อความ mask (maskedText); ใช้ rawText ภายในเท่านั้น

## 6. โครงสร้างข้อมูล (Data Model)

| Collection | ฟิลด์หลัก |
|---|---|
| `users` | email, name, role |
| `conversations` | chatId, lineUserId(masked), displayName, project_name, partner_type, accessLevel, status, messages[] |
| `tagsuggestions` | chatId, tags[], answer_summary, evidence_list[], assumptions, confidence_level/score, risk_flag, status, sampledForReview, reviewedBy, finalTags[], generatedBy |
| `rulebookchunks` | source, section, version, effectiveDate, accessLevel, project_name, text, embedding[], superseded |
| `auditlogs` | action, actor, actorRole, chatId, targetId, detail, meta, createdAt |
| `settings` | confidenceThreshold, topK, reviewSampleRate, metadataFields[] |

## 7. สถาปัตยกรรม & AI

- **Frontend/Backend:** Next.js 15 (App Router), TypeScript, Tailwind v4
- **Database:** MongoDB (Mongoose) — รองรับทั้ง local และ Atlas
- **LLM:** Google Gemini (`gemini-2.5-flash`) สำหรับ tagging — JSON mode + responseSchema
- **Embeddings:** Gemini (`gemini-embedding-001`) — ใช้ API key เดียวกับ tagging
- **Retrieval:** in-app cosine similarity (สลับเป็น Atlas Vector Search ได้)
- **Auth:** session cookie เซ็น HMAC (role-based) — โหมด pilot login ด้วยอีเมล
- **โหมด mock:** ไม่มี GEMINI_API_KEY → keyword tagger + pseudo-embedding (flow ครบทุกขั้น)

## 8. Non-Functional Requirements

- **ความปลอดภัย/PDPA:** PII ต้องถูก mask ก่อนออกจากระบบทุกครั้ง; เอกสาร restricted เข้าถึงตามสิทธิ์เท่านั้น
- **ความถูกต้อง:** ทุกแท็กต้องมี evidence; refusal เมื่อไม่มั่นใจ (ป้องกัน false positive)
- **ตรวจสอบได้:** audit log ครบถ้วน ย้อนดูได้
- **ความเสถียร:** schema validation กัน output เพี้ยน; ระบบไม่ล่มเมื่อโมเดลตอบผิดรูปแบบ
- **ประสิทธิภาพ:** Top_K / chunk size ปรับได้เพื่อรองรับ Peak Traffic
- **ความพร้อมใช้:** รันได้ทันทีในโหมด mock โดยไม่ต้องมี external service

## 9. ตัวชี้วัดความสำเร็จ (Success Metrics / KPI)

- **Tagging accuracy:** ≥ 85% ของแท็กที่ AI เสนอถูกยืนยันโดยมนุษย์ (จากการสุ่มตรวจ 5%)
- **Refusal precision:** เคสที่ถูก refuse ควรเป็นเคสกำกวม/ข้อมูลไม่พอจริง
- **PII leak = 0:** ไม่มี PII หลุดออกจากระบบ
- **เวลาเฉลี่ยต่อการติดแท็ก** ลดลงเทียบกับงานมือ
- **Coverage:** สัดส่วนแชตที่ถูกติดแท็กอัตโนมัติ (ไม่ต้องรีวิว) เพิ่มขึ้นตามเวลา

## 10. แผนการพัฒนา (Roadmap)

| เฟส | ขอบเขต | สถานะ |
|---|---|---|
| **P0–P5** | แอดมิน + RAG + Gemini tagging + fail-safe + review + dashboard (mock LINE) | ✅ เสร็จ |
| **Pilot** | ใช้งานจริงกับทีม Sales Tier-1 + ทดสอบ PII masking ร่วมกับ Security | กำลังเริ่ม |
| **Next** | เชื่อม LINE Messaging API จริง (webhook), เชื่อม CRM/SAP, Atlas Vector Search | วางแผน |
| **Scale** | ปรับ Top_K/threshold จากผล Pilot, ขยายทีมผู้ใช้, รายงานเชิงกลยุทธ์ | วางแผน |

## 11. สมมติฐาน & ความเสี่ยง

- **สมมติฐาน:** มี Gemini API key และ MongoDB (local/Atlas); Rulebook ถูกจัดเตรียมและเวอร์ชันชัดเจน
- **ความเสี่ยง:**
  - คุณภาพแท็กขึ้นกับคุณภาพ/ความครบของ Rulebook (Document Readiness — Workshop 4)
  - Peak Traffic อาจชน rate limit ของ Gemini → ต้องมี fallback/queue (เฟสถัดไป)
  - การตั้ง threshold สูง/ต่ำเกินไปกระทบสมดุล refusal vs coverage → ปรับจากผล Pilot
- **การควบคุม:** human review 5%, audit log, refusal gate, PII masking, access filter

## 12. ภาคผนวก — Tag Catalog (ตัวอย่าง)

`#Quotation` · `#PriceInquiry` · `#ProductQuestion` · `#Complaint` · `#Churn-Risk` ·
`#Renewal` · `#PartnerDeal` · `#TechnicalSupport` · `#Onboarding` · `#GeneralInquiry`

> ปรับ catalog และกฎการเลือกได้ใน Rulebook (หน้า /rulebook) ตามนโยบายองค์กร
