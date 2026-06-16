import { NextResponse, type NextRequest } from "next/server";

// hardcode ชื่อคุกกี้ (เท่ากับ SESSION_COOKIE ใน lib/auth) เพื่อไม่ให้ middleware (edge) ดึง node:crypto เข้ามา
const SESSION_COOKIE = "sc_session";
const PUBLIC_PATHS = ["/login", "/api-docs"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // ยังไม่ล็อกอิน + เข้าหน้าที่ต้องป้องกัน → ส่งไป /login
  if (!hasSession && !PUBLIC_PATHS.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ล็อกอินแล้วแต่เข้า /login → ส่งไป dashboard
  if (hasSession && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand).*)"],
};
