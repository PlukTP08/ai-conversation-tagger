"use server";

import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { User, type UserDoc } from "@/lib/models/User";
import { setSession } from "@/lib/auth";
import type { Role } from "@/lib/constants";

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "กรุณากรอกอีเมล" };

  await dbConnect();
  const user = (await User.findOne({ email }).lean()) as UserDoc | null;
  if (!user) return { error: "ไม่พบผู้ใช้นี้ (ลองรัน npm run seed ก่อน)" };

  await setSession({
    userId: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });

  redirect("/dashboard");
}
