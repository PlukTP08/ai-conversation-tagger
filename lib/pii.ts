/**
 * Regex-based PII masking (WS4 Access control + WS1 PII_Mask metadata)
 * ปกปิดข้อมูลส่วนบุคคลก่อนแสดงผล/ส่งเข้า LLM เพื่อกัน PDPA leak (WS2 Access boundary)
 */

type Rule = { name: string; re: RegExp; mask: (m: string) => string };

const RULES: Rule[] = [
  {
    name: "email",
    re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: () => "[EMAIL]",
  },
  {
    // เบอร์โทรไทย: 08x-xxx-xxxx, 0812345678, +66...
    name: "phone",
    re: /(\+?66|0)\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}/g,
    mask: () => "[PHONE]",
  },
  {
    // เลขบัตรประชาชนไทย 13 หลัก (อาจมีขีด)
    name: "thai_id",
    re: /\b\d[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d\b/g,
    mask: () => "[THAI_ID]",
  },
  {
    // เลขบัญชี/บัตร 10-16 หลักติดกัน
    name: "long_number",
    re: /\b\d{10,16}\b/g,
    mask: () => "[ACCOUNT_NO]",
  },
];

export function maskPII(text: string): string {
  let out = text;
  for (const rule of RULES) {
    out = out.replace(rule.re, (m) => rule.mask(m));
  }
  return out;
}

/** ตรวจว่ามี PII หลงเหลือหรือไม่ (ใช้ตอน access boundary check) */
export function containsPII(text: string): boolean {
  return RULES.some((r) => {
    r.re.lastIndex = 0;
    return r.re.test(text);
  });
}
