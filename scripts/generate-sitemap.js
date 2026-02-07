import fs from "node:fs";
import path from "node:path";
import { fetchPosts } from "./firestore.js";
import { siteUrl } from "./firebase-config.js";

const escapeXml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const today = new Date().toISOString().slice(0, 10);

async function generateSitemap() {
  const posts = await fetchPosts();

  const urls = [
    {
      loc: `${siteUrl}/`,
      lastmod: today,
      changefreq: "weekly",
      priority: "1.0"
    },
    ...posts.map((post) => ({
      loc: `${siteUrl}/post/${post.id}`,
      lastmod: post.lastmod || today,
      changefreq: "monthly",
      priority: "0.8"
    }))
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => {
      const parts = [
        "  <url>",
        `    <loc>${escapeXml(url.loc)}</loc>`,
        `    <lastmod>${url.lastmod}</lastmod>`,
        `    <changefreq>${url.changefreq}</changefreq>`,
        `    <priority>${url.priority}</priority>`,
        "  </url>"
      ];
      return parts.join("\n");
    }),
    "</urlset>",
    ""
  ].join("\n");

  const outputPath = path.resolve("public", "sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf8");
  console.log(`Sitemap generated: ${outputPath}`);
}

generateSitemap().catch((error) => {
  console.error("Failed to generate sitemap:", error);
  process.exitCode = 1;
});
