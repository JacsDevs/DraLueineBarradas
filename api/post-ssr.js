import { getDb } from "./_lib/firebaseAdmin.js";
import { buildPostSlugId, extractIdFromSlugId } from "../src/utils/slugify.js";
import { getInstagramResourceType, normalizeInstagramUrl } from "../src/utils/instagram.js";

const DEFAULT_SITE_URL = "https://dralueinebarradas.com.br";
const SITE_URL = normalizeSiteUrl(globalThis.process?.env?.SITE_URL || DEFAULT_SITE_URL);
const SHELL_CACHE_TTL_MS = 5 * 60 * 1000;

let shellCache = {
  html: "",
  expiresAt: 0
};

function normalizeSiteUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
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

function getPostDate(post) {
  return (
    toDate(post?.publishedAt)
    || toDate(post?.date)
    || toDate(post?.updatedAt)
    || toDate(post?.createdAt)
    || null
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildOrigin(request) {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const forwardedHost = request.headers["x-forwarded-host"];
  const host = forwardedHost || request.headers.host;

  if (!host) return SITE_URL;

  const protocol = String(forwardedProto || "https").split(",")[0].trim() || "https";
  return `${protocol}://${host}`;
}

function buildCanonicalUrl(origin, slugPath) {
  return `${normalizeSiteUrl(origin)}/post/${slugPath}`;
}

function formatDisplayDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function buildMetaDescription(post) {
  const raw = post?.summary || post?.content || "";
  return stripHtml(raw).slice(0, 155);
}

function sanitizeStoredPostHtml(html) {
  if (!html) return "";

  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sstyle=(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\s(src|href)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, ' $1="#"')
    .replace(
      /<div[^>]*class=(["'])[^"']*quill-instagram[^"']*\1[^>]*data-instgrm-permalink=(["'])(.*?)\2[^>]*>[\s\S]*?<\/div>/gi,
      (_, __, ___, url) => renderInstagramBlock(url)
    );
}

function renderInstagramBlock(url) {
  const permalink = normalizeInstagramUrl(url);
  if (!permalink) return "";

  const type = getInstagramResourceType(permalink) || "p";
  return (
    `<blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(permalink)}" ` +
    `data-instgrm-version="14" data-instgrm-type="${escapeHtml(type)}">` +
    `<a href="${escapeHtml(permalink)}" target="_blank" rel="noopener noreferrer">Ver no Instagram</a>` +
    "</blockquote>"
  );
}

function buildArticleMarkup({ post, authorName, formattedDate, sanitizedContent }) {
  const hasFeaturedImage = Boolean(post?.featuredImage);
  const title = escapeHtml(post?.title || "Post");
  const summary = escapeHtml(post?.summary || "");
  const featuredImage = escapeHtml(post?.featuredImage || "");
  const safeAuthorName = escapeHtml(authorName);
  const dateLabel = escapeHtml(formattedDate);

  const featuredSection = hasFeaturedImage
    ? `
      <div class="featured-image-full">
        <img src="${featuredImage}" alt="${title}" />
        <div class="featured-image-full__content">
          <h1 class="featured-image-full__title">${title}</h1>
        </div>
      </div>
    `
    : "";

  const articleTitle = hasFeaturedImage ? "" : `<h1>${title}</h1>`;

  return `
    ${featuredSection}
    <div class="post-body${hasFeaturedImage ? "" : " no-featured-image"}">
      <article class="post-detail" aria-live="polite">
        ${articleTitle}
        ${summary ? `<p class="description">${summary}</p>` : ""}
        <div class="meta">
          <div class="author">
            <div class="author-info">
              <span class="author-name">Publicado por ${safeAuthorName}</span>
              ${dateLabel ? `<span class="author-date">em ${dateLabel}</span>` : ""}
            </div>
          </div>
        </div>
        <div class="content">
          ${sanitizedContent}
        </div>
      </article>
    </div>
  `;
}

function buildArticleSchema({ canonicalUrl, metaDescription, post, authorName, publishedIso }) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post?.title || "",
    description: metaDescription || "",
    image: post?.featuredImage ? [post.featuredImage] : undefined,
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
  });
}

function buildSeoHead({ canonicalUrl, metaDescription, post, authorName, publishedIso, featuredImage }) {
  const title = escapeHtml(`${post?.title || "Post"} | Dra. Lueine Barradas`);
  const description = escapeHtml(metaDescription);
  const canonical = escapeHtml(canonicalUrl);
  const imageMeta = featuredImage
    ? `<meta property="og:image" content="${escapeHtml(featuredImage)}" />`
    : "";
  const publishedMeta = publishedIso
    ? `<meta property="article:published_time" content="${escapeHtml(publishedIso)}" />`
    : "";
  const twitterCard = featuredImage ? "summary_large_image" : "summary";
  const schema = buildArticleSchema({ canonicalUrl, metaDescription, post, authorName, publishedIso });
  const preloadImage = featuredImage
    ? `<link rel="preload" as="image" href="${escapeHtml(featuredImage)}" />`
    : "";

  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${escapeHtml(post?.title || "Post")}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonical}" />
    ${imageMeta}
    ${publishedMeta}
    <meta property="article:author" content="${escapeHtml(authorName)}" />
    <meta name="twitter:card" content="${twitterCard}" />
    ${preloadImage}
    <script type="application/ld+json">${schema}</script>
  `.trim();
}

function mergeHead(html, seoHead) {
  let updated = html.replace(/<title>[\s\S]*?<\/title>/i, "");
  updated = updated.replace(/<meta\s+name=["']description["'][^>]*>/i, "");
  updated = updated.replace(/<link\s+rel=["']canonical["'][^>]*>/i, "");
  updated = updated.replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "");
  updated = updated.replace(/<meta\s+name=["']twitter:card["'][^>]*>/i, "");
  updated = updated.replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/i, "");
  return updated.replace("</head>", `${seoHead}\n</head>`);
}

function injectRootHtml(html, rootHtml) {
  return html.replace(/<div id="root"><\/div>/i, `<div id="root">${rootHtml}</div>`);
}

async function fetchShellHtml(origin) {
  if (shellCache.html && shellCache.expiresAt > Date.now()) {
    return shellCache.html;
  }

  const candidates = [
    `${normalizeSiteUrl(origin)}/`,
    `${SITE_URL}/`
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "text/html"
        }
      });
      if (!response.ok) continue;

      const html = await response.text();
      if (!html.includes('<div id="root"></div>')) continue;

      shellCache = {
        html,
        expiresAt: Date.now() + SHELL_CACHE_TTL_MS
      };
      return html;
    } catch (error) {
      console.error("Failed to fetch app shell:", error);
    }
  }

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dra. Lueine Barradas</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}

async function getAuthorName(db, post) {
  if (!post?.authorId) return "Dra. Lueine Barradas";

  try {
    const snap = await db.collection("users").doc(post.authorId).get();
    return snap.exists ? (snap.data()?.displayName || "Dra. Lueine Barradas") : "Dra. Lueine Barradas";
  } catch (error) {
    console.error("Failed to fetch author:", error);
    return "Dra. Lueine Barradas";
  }
}

function isPublishedPost(post) {
  return post?.status !== "draft";
}

function buildNotFoundHtml(message) {
  return `
    <section class="post-detail" style="max-width: 1100px; margin: 120px auto 60px; padding: 20px;">
      <h1>Post não encontrado</h1>
      <p>${escapeHtml(message)}</p>
      <p><a href="/">Voltar para a página inicial</a></p>
    </section>
  `;
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).send("Method Not Allowed");
    return;
  }

  const requestedSlugId = String(request.query?.slugId || "").trim();
  const postId = extractIdFromSlugId(requestedSlugId);
  const origin = buildOrigin(request);

  if (!postId) {
    const shell = await fetchShellHtml(origin);
    response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.status(404).send(injectRootHtml(shell, buildNotFoundHtml("Este conteúdo não está disponível no momento.")));
    return;
  }

  try {
    const db = getDb();
    const postRef = db.collection("posts").doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists()) {
      const shell = await fetchShellHtml(origin);
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      response.status(404).send(injectRootHtml(shell, buildNotFoundHtml("Este conteúdo não está disponível no momento.")));
      return;
    }

    const post = { id: postSnap.id, ...postSnap.data() };
    if (!isPublishedPost(post)) {
      const shell = await fetchShellHtml(origin);
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      response.status(404).send(injectRootHtml(shell, buildNotFoundHtml("Este conteúdo não está disponível no momento.")));
      return;
    }

    const canonicalSlug = buildPostSlugId({
      title: post?.title || "",
      slug: post?.slug || "",
      id: post?.id || ""
    });

    if (canonicalSlug && requestedSlugId && canonicalSlug !== requestedSlugId) {
      response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
      response.redirect(308, buildCanonicalUrl(origin, canonicalSlug));
      return;
    }

    const shell = await fetchShellHtml(origin);
    const authorName = await getAuthorName(db, post);
    const postDate = getPostDate(post);
    const formattedDate = formatDisplayDate(postDate);
    const publishedIso = postDate ? postDate.toISOString() : "";
    const metaDescription = buildMetaDescription(post);
    const canonicalUrl = buildCanonicalUrl(origin, canonicalSlug || requestedSlugId || postId);
    const sanitizedContent = sanitizeStoredPostHtml(post?.content || "");
    const articleMarkup = buildArticleMarkup({
      post,
      authorName,
      formattedDate,
      sanitizedContent
    });
    const seoHead = buildSeoHead({
      canonicalUrl,
      metaDescription,
      post,
      authorName,
      publishedIso,
      featuredImage: post?.featuredImage || ""
    });

    const html = injectRootHtml(mergeHead(shell, seoHead), articleMarkup);

    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
    response.status(200).send(html);
  } catch (error) {
    console.error("Failed to prerender post:", error);
    response.status(500).send("Internal Server Error");
  }
}
