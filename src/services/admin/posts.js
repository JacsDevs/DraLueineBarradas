import { db, storage } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

function canDeleteFromStorage(location) {
  if (!location || typeof location !== "string") return false;

  if (location.startsWith("gs://")) return true;

  if (location.startsWith("http://") || location.startsWith("https://")) {
    return (
      location.includes("firebasestorage.googleapis.com")
      || location.includes("storage.googleapis.com")
    );
  }

  return true;
}

async function safeDeleteStorageObject(location) {
  if (!canDeleteFromStorage(location)) return;

  try {
    await deleteObject(ref(storage, location));
  } catch (error) {
    console.warn("Nao foi possivel remover arquivo no Storage:", error?.message || error);
  }
}

export async function fetchPosts({ userId } = {}) {
  const baseRef = collection(db, "posts");
  const ref = userId ? query(baseRef, where("authorId", "==", userId)) : baseRef;
  const snapshot = await getDocs(ref);
  const list = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

  return list.sort((a, b) => {
    const bTime = b.updatedAt?.seconds || b.date?.seconds || b.createdAt?.seconds || 0;
    const aTime = a.updatedAt?.seconds || a.date?.seconds || a.createdAt?.seconds || 0;
    return bTime - aTime;
  });
}

export async function savePost({ isEditingId, data }) {
  if (isEditingId) {
    await updateDoc(doc(db, "posts", isEditingId), data);
  } else {
    await addDoc(collection(db, "posts"), data);
  }
}

export async function deletePost({ id, featuredImage }) {
  if (featuredImage) {
    await safeDeleteStorageObject(featuredImage);
  }

  const commentsSnapshot = await getDocs(collection(db, "posts", id, "comments"));
  if (!commentsSnapshot.empty) {
    const comments = commentsSnapshot.docs;
    const chunkSize = 450;

    for (let i = 0; i < comments.length; i += chunkSize) {
      const chunk = comments.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((commentDoc) => batch.delete(commentDoc.ref));
      await batch.commit();
    }
  }

  await deleteDoc(doc(db, "posts", id));
}

export async function deleteFeaturedImage(featuredImage) {
  if (featuredImage) {
    await safeDeleteStorageObject(featuredImage);
  }
}
