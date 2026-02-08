import { db, storage } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore";
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
  await deleteDoc(doc(db, "posts", id));
}

export async function deleteFeaturedImage(featuredImage) {
  if (featuredImage) {
    await deleteObject(ref(storage, featuredImage));
  }
}
