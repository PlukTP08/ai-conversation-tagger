"use client";

import { useActionState } from "react";
import Image from "next/image";
import { loginAction } from "./actions";
import { Button } from "@/components/ui";

const DEMO_USERS = [
  "admin@smilefokus.com",
  "supervisor@smilefokus.com",
  "sales@smilefokus.com",
  "ai@smilefokus.com",
];

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null as { error?: string } | null);

  return (
    <div className="grid min-h-screen grid-cols-1 bg-canvas lg:grid-cols-2">
      {/* left — form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <form
          action={action}
          className="flex w-full max-w-[420px] flex-col gap-6 rounded-3xl border border-ink-200 bg-surface p-10 shadow-lg"
        >
          <Image
            src="/brand/logo-tag-line.png"
            alt="vibeTAGGING"
            width={1254}
            height={1254}
            priority
            className="mx-auto h-auto w-40"
          />

          <div className="space-y-1.5">
            <h1 className="page-title text-[30px] leading-none">เข้าสู่ระบบ</h1>
            <p className="text-sm text-ink-500">ระบบติดแท็กแชต LINE OA · สำหรับแอดมินและทีมงาน</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-ink-900">
              อีเมลที่ทำงาน
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@smilefokus.com"
              defaultValue="admin@smilefokus.com"
              className="h-12 rounded-xl border border-ink-300 bg-surface px-4 text-base text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" loading={pending} fullWidth className="h-12 text-base">
            {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </Button>

          <div className="border-t border-ink-200 pt-4">
            <p className="mb-2 text-xs font-medium text-ink-500">บัญชีเดโม</p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_USERS.map((u) => (
                <code
                  key={u}
                  className="rounded-md bg-ink-100 px-2 py-1 text-[11px] text-ink-700"
                >
                  {u}
                </code>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* right — brand illustration */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/brand/login-illustration.png"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-x-8 bottom-8 rounded-2xl border border-white/60 bg-white/90 p-5 shadow-lg backdrop-blur-md">
          <h3 className="mb-1.5 text-lg font-semibold text-ink-900">
            ติดแท็กแชตอัตโนมัติ ด้วย AI ที่ตรวจสอบได้
          </h3>
          <p className="text-[13px] leading-relaxed text-ink-500">
            RAG + Gemini วิเคราะห์เจตนาลูกค้าจาก LINE OA โดยอ้างอิง Rulebook
            พร้อมให้ทีมงานยืนยันก่อนใช้จริง
          </p>
        </div>
      </div>
    </div>
  );
}
