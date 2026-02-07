import { firebaseConfig } from "./firebase-config.js";

const { apiKey, projectId } = firebaseConfig;
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

const toIsoDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const parseTimestampField = (field) => {
  if (!field) return null;
  if (field.timestampValue) return field.timestampValue;
  if (field.integerValue) {
    const seconds = Number(field.integerValue);
    if (!Number.isNaN(seconds)) {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return null;
};

const extractId = (docName) => {
  if (!docName) return null;
  const parts = docName.split("/");
  return parts[parts.length - 1];
};

export async function fetchPosts() {
  const posts = [];
  let pageToken = "";

  while (true) {
    const url = new URL(`${baseUrl}/posts`);
    url.searchParams.set("key", apiKey);
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Firestore request failed: ${response.status}`);
    }

    const data = await response.json();
    const documents = data.documents || [];

    for (const doc of documents) {
      const id = extractId(doc.name);
      const fields = doc.fields || {};
      const rawDate =
        parseTimestampField(fields.date) ||
        parseTimestampField(fields.updatedAt) ||
        parseTimestampField(fields.createdAt);

      posts.push({
        id,
        title: fields.title?.stringValue || "",
        summary: fields.summary?.stringValue || "",
        lastmod: toIsoDate(rawDate)
      });
    }

    if (data.nextPageToken) {
      pageToken = data.nextPageToken;
    } else {
      break;
    }
  }

  return posts.filter((post) => post.id);
}
