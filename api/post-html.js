import { getDb } from "./_lib/firebaseAdmin.js";
import {
  CLIENT_MODULE_PRELOADS,
  CLIENT_SCRIPTS,
  CLIENT_STYLESHEETS
} from "./_generated/clientAssets.js";

const SITE_URL = normalizeSiteUrl(
  globalThis.process?.env?.SITE_URL || "https://www.dralueinebarradas.com.br"
);
const DEFAULT_TITLE = "Dra. Lueine Barradas | Clínica Geral e Cardiologia Clínica em Bragança, PA";
const DEFAULT_DESCRIPTION = "Clínica geral e cardiologia clínica em Bragança, Pará. Consultas cardiológicas, check-up e prevenção cardiovascular com a Dra. Lueine Barradas.";
const GOOGLE_SITE_VERIFICATION = "-CaSssz5wZlqtZLv4QiJhQZB388YrspiWCKlqx6P6kA";
const GTM_ID = "GTM-5FV85GKP";

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

function extractIdFromSlugId(slugId) {
  if (!slugId) return "";
  const lastDash = slugId.lastIndexOf("-");
  if (lastDash === -1) return slugId;
  const maybeId = slugId.slice(lastDash + 1);
  return maybeId || slugId;
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.toMillis === "function") return new Date(value.toMillis());
  if (value instanceof Date) return value;
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
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

function isDraftPost(post) {
  return post?.status === "draft";
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDescription(post) {
  const rawText = stripHtml(post?.summary || post?.content || DEFAULT_DESCRIPTION);
  return (rawText || DEFAULT_DESCRIPTION).slice(0, 155);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function safeJson(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function buildAssetTags() {
  const modulePreloadTags = CLIENT_MODULE_PRELOADS.map((href) => (
    `<link rel="modulepreload" crossorigin href="${escapeHtml(href)}">`
  ));
  const stylesheetTags = CLIENT_STYLESHEETS.map((href) => (
    `<link rel="stylesheet" crossorigin href="${escapeHtml(href)}">`
  ));
  const scriptTags = CLIENT_SCRIPTS.map((src) => (
    `<script type="module" crossorigin src="${escapeHtml(src)}"></script>`
  ));

  return [...modulePreloadTags, ...stylesheetTags, ...scriptTags].join("\n    ");
}

function buildGtmScript() {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${GTM_ID}');`;
}

function buildNoScriptTag() {
  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

function buildPostHtml(post) {
  const title = post?.title || "Post";
  const description = buildDescription(post);
  const slugPath = buildPostSlugId({ title, id: post.id, slug: post.slug });
  const canonicalUrl = `${SITE_URL}/post/${slugPath}`;
  const pageTitle = `${title} | Dra. Lueine Barradas`;
  const authorName = "Dra. Lueine Barradas";
  const publishedDate = getPostDate(post);
  const publishedIso = publishedDate ? publishedDate.toISOString() : null;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    author: {
      "@type": "Person",
      name: authorName
    },
    publisher: {
      "@type": "Organization",
      name: "Dra. Lueine Barradas",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.ico`
      }
    },
    datePublished: publishedIso || undefined,
    dateModified: publishedIso || undefined,
    mainEntityOfPage: canonicalUrl
  };

  return buildHtmlDocument({
    title: pageTitle,
    description,
    canonicalUrl,
    robots: "",
    ogType: "article",
    ogTitle: title,
    ogDescription: description,
    ogImage: post.featuredImage || "",
    twitterCard: post.featuredImage ? "summary_large_image" : "summary",
    jsonLd: articleSchema,
    rootHtml: `
      <main>
        <article>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
        </article>
      </main>`
  });
}

function buildNotFoundHtml() {
  return buildHtmlDocument({
    title: `Post não encontrado | Dra. Lueine Barradas`,
    description: "Este conteúdo não está disponível no momento.",
    canonicalUrl: `${SITE_URL}/`,
    robots: "noindex,follow",
    ogType: "website",
    ogTitle: "Post não encontrado",
    ogDescription: "Este conteúdo não está disponível no momento.",
    ogImage: "",
    twitterCard: "summary",
    jsonLd: null,
    rootHtml: `
      <main>
        <h1>Post não encontrado</h1>
        <p>Este conteúdo não está disponível no momento.</p>
      </main>`
  });
}

function buildHtmlDocument({
  title,
  description,
  canonicalUrl,
  robots,
  ogType,
  ogTitle,
  ogDescription,
  ogImage,
  twitterCard,
  jsonLd,
  rootHtml
}) {
  const assetTags = buildAssetTags();
  const robotsTag = robots
    ? `<meta data-rh="true" name="robots" content="${escapeHtml(robots)}" />`
    : "";
  const imageTags = ogImage
    ? `<meta data-rh="true" property="og:image" content="${escapeHtml(ogImage)}" />`
    : "";
  const jsonLdTag = jsonLd
    ? `<script data-rh="true" type="application/ld+json">${safeJson(jsonLd)}</script>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title || DEFAULT_TITLE)}</title>
    <meta data-rh="true" name="description" content="${escapeHtml(description || DEFAULT_DESCRIPTION)}" />
    ${robotsTag}
    <meta name="google-site-verification" content="${GOOGLE_SITE_VERIFICATION}" />
    <link data-rh="true" rel="canonical" href="${escapeHtml(canonicalUrl || SITE_URL)}" />
    <meta data-rh="true" property="og:locale" content="pt_BR" />
    <meta data-rh="true" property="og:site_name" content="Dra. Lueine Barradas" />
    <meta data-rh="true" property="og:title" content="${escapeHtml(ogTitle || title || DEFAULT_TITLE)}" />
    <meta data-rh="true" property="og:description" content="${escapeHtml(ogDescription || description || DEFAULT_DESCRIPTION)}" />
    <meta data-rh="true" property="og:type" content="${escapeHtml(ogType || "website")}" />
    <meta data-rh="true" property="og:url" content="${escapeHtml(canonicalUrl || SITE_URL)}" />
    ${imageTags}
    <meta data-rh="true" name="twitter:card" content="${escapeHtml(twitterCard || "summary")}" />
    ${jsonLdTag}
    <script>${buildGtmScript()}</script>
    ${assetTags}
  </head>
  <body>
    ${buildNoScriptTag()}
    <div id="root">${rootHtml || ""}</div>
  </body>
</html>`;
}

function getSlugId(request) {
  const parsedUrl = new URL(request.url || "", "https://local.invalid");
  const fromQuery = parsedUrl.searchParams.get("slugId");
  if (fromQuery) return fromQuery;

  if (typeof request.query?.slugId === "string") return request.query.slugId;
  if (Array.isArray(request.query?.slugId)) return request.query.slugId[0] || "";

  return "";
}

function sendHtml(request, response, statusCode, html) {
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  response.status(statusCode);

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  response.send(html);
}

export default async function handler(request, response) {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.setHeader("Allow", "GET, HEAD");
    response.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const slugId = getSlugId(request);
    const postId = extractIdFromSlugId(slugId);

    if (!postId) {
      sendHtml(request, response, 404, buildNotFoundHtml());
      return;
    }

    const db = getDb();
    const postSnap = await db.collection("posts").doc(postId).get();

    if (!postSnap.exists) {
      sendHtml(request, response, 404, buildNotFoundHtml());
      return;
    }

    const post = { id: postSnap.id, ...postSnap.data() };
    if (isDraftPost(post)) {
      sendHtml(request, response, 404, buildNotFoundHtml());
      return;
    }

    sendHtml(request, response, 200, buildPostHtml(post));
  } catch (error) {
    console.error("Failed to render post HTML:", error);
    sendHtml(request, response, 500, buildNotFoundHtml());
  }
}
