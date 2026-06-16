import { NextResponse } from "next/server";

/** OpenAPI 3.0 spec — เสิร์ฟที่ GET /api/openapi (ใช้โดยหน้า /api-docs) */
const spec = {
  openapi: "3.0.3",
  info: {
    title: "smileCULTURE Admin API",
    version: "1.0.0",
    description:
      "REST API สำหรับระบบ auto-tagging แชต LINE OA (RAG + Gemini + human-in-the-loop).\n\n" +
      "การยืนยันตัวตน: ใช้ session cookie (`sc_session`) — ล็อกอินผ่านหน้าเว็บก่อน แล้ว 'Try it out' จะแนบ cookie ให้อัตโนมัติ (same-origin).",
  },
  servers: [{ url: "/", description: "current host" }],
  tags: [
    { name: "Chats", description: "บทสนทนาจาก LINE OA" },
    { name: "Tags", description: "การติดแท็ก + human review" },
    { name: "Dashboard", description: "สถิติภาพรวม" },
    { name: "Webhook", description: "รับข้อความจาก LINE Messaging API" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "sc_session" },
    },
    schemas: {
      Evidence: {
        type: "object",
        properties: {
          source: { type: "string", example: "Corporate Tagging Rulebook" },
          section: { type: "string", example: "2.3 Intent Criteria" },
          version: { type: "string", example: "3.0" },
        },
      },
      TagSuggestion: {
        type: "object",
        properties: {
          _id: { type: "string" },
          chatId: { type: "string", example: "LINEUser-4591" },
          tags: { type: "array", items: { type: "string" }, example: ["#Quotation"] },
          answer_summary: { type: "string" },
          evidence_list: { type: "array", items: { $ref: "#/components/schemas/Evidence" } },
          assumptions: { type: "string" },
          confidence_level: { type: "string", enum: ["high", "medium", "low"] },
          confidence_score: { type: "number", format: "float", example: 0.92 },
          risk_flag: {
            type: "string",
            enum: ["none", "outdated_source", "conflict_detected", "restricted_access"],
          },
          status: { type: "string", enum: ["suggested", "approved", "rejected", "refused"] },
          sampledForReview: { type: "boolean" },
          reviewedBy: { type: "string" },
          finalTags: { type: "array", items: { type: "string" } },
          generatedBy: { type: "string", enum: ["gemini", "mock"] },
        },
      },
      Conversation: {
        type: "object",
        properties: {
          chatId: { type: "string", example: "LINEUser-4591" },
          displayName: { type: "string", example: "คุณวิภา (PEA)" },
          project_name: { type: "string" },
          accessLevel: { type: "string", enum: ["public", "internal", "restricted"] },
          status: {
            type: "string",
            enum: ["open", "tagged", "pending_review", "closed"],
          },
          lastMessageAt: { type: "string", format: "date-time" },
          messages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sender: { type: "string", enum: ["customer", "agent"] },
                maskedText: { type: "string", description: "ข้อความหลัง mask PII" },
                timestamp: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      Error: { type: "object", properties: { error: { type: "string" } } },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    "/api/chats": {
      get: {
        tags: ["Chats"],
        summary: "รายการบทสนทนา",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["open", "tagged", "pending_review", "closed"] },
            description: "กรองตามสถานะ",
          },
          { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Conversation" } },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/chats/{chatId}": {
      get: {
        tags: ["Chats"],
        summary: "บทสนทนา 1 รายการ + tag suggestion ล่าสุด",
        parameters: [
          { name: "chatId", in: "path", required: true, schema: { type: "string" }, example: "LINEUser-4591" },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    conversation: { $ref: "#/components/schemas/Conversation" },
                    suggestion: { $ref: "#/components/schemas/TagSuggestion" },
                  },
                },
              },
            },
          },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/tags/suggest": {
      post: {
        tags: ["Tags"],
        summary: "สั่ง AI ติดแท็ก (RAG + Gemini)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["chatId"],
                properties: { chatId: { type: "string", example: "LINEUser-6500" } },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "สร้าง suggestion สำเร็จ",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/TagSuggestion" } },
                },
              },
            },
          },
          "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/tags/{id}/review": {
      post: {
        tags: ["Tags"],
        summary: "ยืนยัน/ปฏิเสธแท็ก (human-in-the-loop)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "TagSuggestion _id" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision"],
                properties: {
                  decision: { type: "string", enum: ["approve", "reject"] },
                  finalTags: { type: "array", items: { type: "string" }, example: ["#Quotation"] },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", properties: { data: { $ref: "#/components/schemas/TagSuggestion" } } },
              },
            },
          },
          "400": { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/dashboard/stats": {
      get: {
        tags: ["Dashboard"],
        summary: "สถิติภาพรวม",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalChats: { type: "integer" },
                    approved: { type: "integer" },
                    pendingReview: { type: "integer" },
                    totalSuggestions: { type: "integer" },
                    confidenceDistribution: {
                      type: "object",
                      properties: { high: { type: "integer" }, medium: { type: "integer" }, low: { type: "integer" } },
                    },
                    riskFlags: { type: "object", additionalProperties: { type: "integer" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/webhook/line": {
      get: {
        tags: ["Webhook"],
        summary: "สถานะ webhook",
        security: [],
        responses: { "200": { description: "OK" } },
      },
      post: {
        tags: ["Webhook"],
        summary: "รับ event จาก LINE → เขียน DB (mask PII)",
        description:
          "ตรวจ `X-Line-Signature` เมื่อตั้ง LINE_CHANNEL_SECRET. ถ้า LINE_AUTO_TAG=1 จะติดแท็กอัตโนมัติ",
        security: [],
        parameters: [{ name: "X-Line-Signature", in: "header", schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  events: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", example: "message" },
                        source: { type: "object", properties: { userId: { type: "string" } } },
                        message: {
                          type: "object",
                          properties: { type: { type: "string", example: "text" }, text: { type: "string" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "รับสำเร็จ" },
          "401": { description: "signature ไม่ถูกต้อง" },
        },
      },
    },
  },
};

export function GET() {
  return NextResponse.json(spec);
}
