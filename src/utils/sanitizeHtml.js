import DOMPurify from "dompurify";
import { normalizeInstagramUrl } from "./instagram";

const ABSOLUTE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const ABSOLUTE_MEDIA_PROTOCOLS = new Set(["http:", "https:"]);
const YOUTUBE_IFRAME_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com"
]);
const URL_BASE = "https://local.invalid";

const PURIFY_CONFIG = Object.freeze({
  USE_PROFILES: { html: true },
  ADD_TAGS: ["figure", "figcaption", "iframe"],
  ADD_ATTR: [
    "allow",
    "allowfullscreen",
    "class",
    "controls",
    "data-alt",
    "data-caption",
    "data-instgrm-permalink",
    "data-instgrm-version",
    "data-source",
    "decoding",
    "frameborder",
    "loading",
    "playsinline",
    "poster",
    "preload",
    "referrerpolicy",
    "rel",
    "role",
    "sizes",
    "srcset",
    "target",
    "title"
  ],
  FORBID_ATTR: ["style"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i
});

const parseUrl = (value) => {
  try {
    return new URL(value, URL_BASE);
  } catch {
    return null;
  }
};

const isRelativeUrl = (value) => value.startsWith("/");
const isAnchorUrl = (value) => value.startsWith("#");

const isSafeLinkUrl = (value) => {
  if (!value) return false;
  if (isRelativeUrl(value) || isAnchorUrl(value)) return true;

  const parsed = parseUrl(value);
  return Boolean(parsed && ABSOLUTE_LINK_PROTOCOLS.has(parsed.protocol));
};

const isSafeMediaUrl = (value) => {
  if (!value) return false;
  if (isRelativeUrl(value)) return true;

  const parsed = parseUrl(value);
  return Boolean(parsed && ABSOLUTE_MEDIA_PROTOCOLS.has(parsed.protocol));
};

const isAllowedIframeSrc = (value) => {
  if (!value) return false;
  const parsed = parseUrl(value);
  if (!parsed || !ABSOLUTE_MEDIA_PROTOCOLS.has(parsed.protocol)) return false;

  const host = parsed.hostname.replace(/^www\./, "");
  if (!YOUTUBE_IFRAME_HOSTS.has(host)) return false;

  return parsed.pathname.includes("/embed/");
};

const normalizeInstagramEmbedNode = (node, doc) => {
  const permalink = normalizeInstagramUrl(
    (node.getAttribute("data-instgrm-permalink") || node.querySelector("a[href]")?.getAttribute("href") || "").trim()
  );

  if (!permalink) {
    node.remove();
    return;
  }

  if (!["DIV", "BLOCKQUOTE"].includes(node.tagName)) {
    node.remove();
    return;
  }

  if (node.tagName === "DIV") {
    node.classList.add("quill-instagram");
  }

  if (node.tagName === "BLOCKQUOTE") {
    node.classList.add("instagram-media");
  }

  node.setAttribute("data-instgrm-permalink", permalink);
  node.setAttribute("data-instgrm-version", "14");

  let anchor = node.querySelector("a");
  if (!anchor) {
    anchor = doc.createElement("a");
    node.replaceChildren(anchor);
  }

  anchor.setAttribute("href", permalink);
  anchor.setAttribute("target", "_blank");
  anchor.setAttribute("rel", "noopener noreferrer");
  anchor.textContent = (anchor.textContent || "").trim() || "Ver no Instagram";
};

export function sanitizeRichHtml(html) {
  if (!html) return "";

  const purifiedHtml = DOMPurify.sanitize(html, PURIFY_CONFIG);
  const parser = new DOMParser();
  const doc = parser.parseFromString(purifiedHtml, "text/html");

  doc.querySelectorAll("a[href]").forEach((anchor) => {
    const href = (anchor.getAttribute("href") || "").trim();
    if (!isSafeLinkUrl(href)) {
      anchor.removeAttribute("href");
    }

    if (anchor.getAttribute("target") === "_blank") {
      anchor.setAttribute("rel", "noopener noreferrer");
      return;
    }

    anchor.removeAttribute("target");
    anchor.removeAttribute("rel");
  });

  doc.querySelectorAll("img[src], video[src], source[src]").forEach((node) => {
    const src = (node.getAttribute("src") || "").trim();
    if (!isSafeMediaUrl(src)) node.remove();
  });

  doc.querySelectorAll("iframe").forEach((iframe) => {
    const src = (iframe.getAttribute("src") || "").trim();
    if (!isAllowedIframeSrc(src)) {
      iframe.remove();
      return;
    }

    iframe.classList.add("rich-embed-video");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  });

  doc.querySelectorAll("div.quill-instagram, blockquote.instagram-media").forEach((node) => {
    normalizeInstagramEmbedNode(node, doc);
  });

  return doc.body.innerHTML;
}
