export function slugify(value) {
  if (!value) return "";
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function buildPostSlugId({ title, id, slug }) {
  const base = slug || slugify(title);
  if (!base) return id || "";
  if (!id) return base;
  return `${base}-${id}`;
}

export function extractIdFromSlugId(slugId) {
  if (!slugId) return "";
  const lastDash = slugId.lastIndexOf("-");
  if (lastDash === -1) return slugId;
  const maybeId = slugId.slice(lastDash + 1);
  return maybeId || slugId;
}
