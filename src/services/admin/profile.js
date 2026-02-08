import { db, storage } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, deleteObject } from "firebase/storage";
import { uploadFileOptimized } from "./uploads";

export async function uploadProfileAvatar({ user, file }) {
  const url = await uploadFileOptimized(
    file,
    `users/${user.uid}/avatar_${Date.now()}.webp`,
    { maxWidth: 150, maxHeight: 150, maxSizeMB: 10, isImage: true }
  );

  await updateProfile(user, { photoURL: url });
  return url;
}

export async function saveUserProfile({ user, userProfile }) {
  await updateProfile(user, { displayName: userProfile.displayName, photoURL: userProfile.photoURL });
  await setDoc(
    doc(db, "users", user.uid),
    {
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      email: user.email,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function deleteProfileAvatar(photoURL) {
  if (!photoURL) return;
  try {
    await deleteObject(ref(storage, photoURL));
  } catch (err) {
    console.error("Erro ao remover avatar do storage:", err);
  }
}
