import type { Metadata } from "next";

export const metadata: Metadata = { title: "API Docs — smileCULTURE Admin" };

/**
 * หน้า Swagger UI — โหลด swagger-ui จาก CDN (ไม่ต้องเพิ่ม dependency)
 * อ่าน spec จาก /api/openapi
 */
export default function ApiDocsPage() {
  const html = `
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <div id="swagger"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.addEventListener('load', function () {
        window.ui = SwaggerUIBundle({
          url: '/api/openapi',
          dom_id: '#swagger',
          deepLinking: true,
          withCredentials: true,
          tryItOutEnabled: true,
        });
      });
    </script>
  `;
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
