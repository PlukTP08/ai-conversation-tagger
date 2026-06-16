/** Roles ตาม PDF (access/visibility ของแต่ละ workshop) */
export const ROLES = [
  "admin",
  "supervisor",
  "sales",
  "sales_tier1",
  "ai_engineer",
  "security",
  "product_owner",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "ผู้ดูแลระบบ (Admin)",
  supervisor: "หัวหน้าทีม (Supervisor)",
  sales: "ฝ่ายขาย (Sales)",
  sales_tier1: "Sales Tier-1 (Pilot)",
  ai_engineer: "AI Engineer",
  security: "Security",
  product_owner: "Product Owner",
};

/**
 * Access level ของเอกสาร/แชต — ใช้กรองก่อน retrieve (WS2 Access boundary, WS4 access control)
 * ตัวเลขสูง = ต้องสิทธิ์สูงกว่าจึงเข้าถึงได้
 */
export const ACCESS_LEVELS = {
  public: 0,
  internal: 1,
  restricted: 2,
} as const;
export type AccessLevel = keyof typeof ACCESS_LEVELS;

/** สิทธิ์การเข้าถึงสูงสุดของแต่ละ role */
export const ROLE_MAX_ACCESS: Record<Role, AccessLevel> = {
  admin: "restricted",
  supervisor: "restricted",
  security: "restricted",
  product_owner: "internal",
  ai_engineer: "internal",
  sales: "internal",
  sales_tier1: "internal",
};

/** Tag categories (intent/journey) อ้างอิงตัวอย่างใน Rulebook */
export const TAG_CATALOG = [
  "#Quotation",
  "#PriceInquiry",
  "#ProductQuestion",
  "#Complaint",
  "#Churn-Risk",
  "#Renewal",
  "#PartnerDeal",
  "#TechnicalSupport",
  "#Onboarding",
  "#GeneralInquiry",
] as const;

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const RISK_FLAGS = [
  "none",
  "outdated_source",
  "conflict_detected",
  "restricted_access",
] as const;
export type RiskFlag = (typeof RISK_FLAGS)[number];

export const RISK_FLAG_LABELS: Record<RiskFlag, string> = {
  none: "ปกติ",
  outdated_source: "ข้อมูลเก่า (outdated)",
  conflict_detected: "พบข้อขัดแย้ง (conflict)",
  restricted_access: "สิทธิ์ไม่เพียงพอ (restricted)",
};

/** สถานะของ tag suggestion (human-in-the-loop) */
export const TAG_STATUS = ["suggested", "approved", "rejected", "refused"] as const;
export type TagStatus = (typeof TAG_STATUS)[number];

export const CONVERSATION_STATUS = ["open", "tagged", "pending_review", "closed"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUS)[number];

/** เกณฑ์ refusal ตาม WS4 — ปรับได้ในหน้า Settings */
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;
export const DEFAULT_TOP_K = 4;
export const DEFAULT_REVIEW_SAMPLE_RATE = 0.05; // สุ่ม 5% (WS4 human review)
