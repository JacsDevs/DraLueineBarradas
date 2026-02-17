import { collection, getDocs } from "firebase-admin/firestore";
import { getDb } from "./_lib/firebaseAdmin.js";

const XML_HEADER = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
const SITE_URL = normalizeSiteUrl(
  globalThis.process?.env?.SITE_URL || "https://dralueinebarradas.com.br"
);
const ROOT_ENTRY = {
  loc: `${SITE_URL}/`,
  changefreq: "weekly",
  priority: "1.0"
};

function normalizeSiteUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function slugify(value) {
  if (!value) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function buildPostSlugId({ title, id, slug }) {
  const base = slug || slugify(title);
  if (!base) return id || "";
  if (!id) return base;
  return `${base}-${id}`;
}

function toDate(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value.toMillis === "function") {
    return new Date(value.toMillis());
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function toDateOnly(value) {
  const date = toDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

function getPostDate(post) {
  return (
    toDate(post?.publishedAt)
    || toDate(post?.date)
    || toDate(post?.updatedAt)
    || toDate(post?.createdAt)
    || null
  );
}

function escapeXml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function buildUrlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
    priority ? `    <priority>${priority}</priority>` : "",
    "  </url>"
  ].filter(Boolean).join("\n");
}

function buildXml(entries) {
  return `${XML_HEADER}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
}

function isPublishedPost(post) {
  return post?.status !== "draft";
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const db = getDb();
    const snapshot = await getDocs(collection(db, "posts"));
    const allPosts = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    const publishedPosts = allPosts
      .filter(isPublishedPost)
      .sort((a, b) => {
        const bTime = getPostDate(b)?.getTime() || 0;
        const aTime = getPostDate(a)?.getTime() || 0;
        return bTime - aTime;
      });

    const entries = [
      buildUrlEntry({
        ...ROOT_ENTRY,
        lastmod: toDateOnly(new Date())
      })
    ];

    for (const post of publishedPosts) {
      const slugPath = buildPostSlugId({
        title: post?.title || "",
        slug: post?.slug || "",
        id: post?.id || ""
      });

      if (!slugPath) continue;

      const date = getPostDate(post);
      entries.push(buildUrlEntry({
        loc: `${SITE_URL}/post/${slugPath}`,
        lastmod: toDateOnly(date),
        changefreq: "weekly",
        priority: "0.8"
      }));
    }

    response.setHeader("Content-Type", "application/xml; charset=utf-8");
    response.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    response.status(200).send(buildXml(entries));
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    response.status(500).json({ error: "Failed to generate sitemap" });
  }
}
