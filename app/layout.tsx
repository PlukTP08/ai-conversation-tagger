import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "smileCULTURE Admin — LINE OA Chat Tagging",
  description: "ระบบ auto-tagging แชต LINE OA ด้วย RAG + Gemini พร้อม human-in-the-loop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
