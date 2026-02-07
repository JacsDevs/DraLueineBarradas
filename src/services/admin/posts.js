import { db, storage } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

export async function fetchPosts() {
  const snapshot = await getDocs(collection(db, "posts"));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
