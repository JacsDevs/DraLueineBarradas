const INSTAGRAM_HOSTS = new Set(["instagram.com", "instagr.am"]);
const INSTAGRAM_RESOURCE_TYPES = new Set(["p", "reel", "tv"]);

function parseInstagramResource(rawUrl) {
  const value = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (!value) return null;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;

  const host = parsed.hostname.replace(/^www\./, "");
  if (!INSTAGRAM_HOSTS.has(host)) return null;

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  let [resourceType, resourceId] = segments;
  if (resourceType === "reels") resourceType = "reel";
  if (!INSTAGRAM_RESOURCE_TYPES.has(resourceType) || !resourceId) return null;

  resourceId = resourceId.trim();
  if (!resourceId) return null;

  return { resourceType, resourceId };
}

export function normalizeInstagramUrl(rawUrl) {
  const resource = parseInstagramResource(rawUrl);
  if (!resource) return "";
  const { resourceType, resourceId } = resource;
  return `https://www.instagram.com/${resourceType}/${resourceId}/`;
}

export function isInstagramUrl(value) {
  return Boolean(normalizeInstagramUrl(value));
}

export function getInstagramResourceType(rawUrl) {
  return parseInstagramResource(rawUrl)?.resourceType || "";
}

export function buildInstagramEmbedUrl(rawUrl) {
  const permalink = normalizeInstagramUrl(rawUrl);
  if (!permalink) return "";
  return `${permalink}embed/captioned/`;
}
