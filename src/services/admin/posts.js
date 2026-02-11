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

export async function fetchPosts({ userId } = {}) {
  const baseRef = collection(db, "posts");
  const ref = userId ? query(baseRef, where("authorId", "==", userId)) : baseRef;
  const snapshot = await getDocs(ref);
  const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
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
    await deleteObject(ref(storage, featuredImage));
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
    await deleteObject(ref(storage, featuredImage));
  }
}
