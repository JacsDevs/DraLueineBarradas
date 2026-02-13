export const POST_STATUSES = Object.freeze({
  PUBLISHED: "published",
  DRAFT: "draft"
});

export function getPostStatus(post) {
  return post?.status === POST_STATUSES.DRAFT
    ? POST_STATUSES.DRAFT
    : POST_STATUSES.PUBLISHED;
}

export function isDraftPost(post) {
  return getPostStatus(post) === POST_STATUSES.DRAFT;
}

export function isPublishedPost(post) {
  return getPostStatus(post) === POST_STATUSES.PUBLISHED;
}

export function timestampToMillis(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  return null;
}

export function getPostSortMillis(post) {
  const candidates = [post?.publishedAt, post?.date, post?.updatedAt, post?.createdAt];

  for (const candidate of candidates) {
    const millis = timestampToMillis(candidate);
    if (millis !== null) return millis;
  }

  return 0;
}

export function getPostDisplayDate(post) {
  const candidates = [post?.publishedAt, post?.date, post?.updatedAt, post?.createdAt];

  for (const candidate of candidates) {
    if (candidate) return candidate;
  }

  return null;
}
