import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { saveUserProfile as saveUserProfileService, uploadProfileAvatar, deleteProfileAvatar } from "../services/admin/profile";

export function useAuthProfile({ setUploading }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState({ displayName: "", photoURL: "" });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [pendingAvatarRemoval, setPendingAvatarRemoval] = useState(false);
  const [avatarToRemove, setAvatarToRemove] = useState("");
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);
      const authProfile = { displayName: u.displayName || "", photoURL: u.photoURL || "" };

      try {
        const userSnap = await getDoc(doc(db, "users", u.uid));
        if (userSnap.exists()) {
          const data = userSnap.data() || {};
          const mergedProfile = {
            displayName: data.displayName || authProfile.displayName,
            photoURL: data.photoURL || authProfile.photoURL
          };
          setUserProfile(mergedProfile);
          setOriginalProfile(mergedProfile);
          return;
        }

        await saveUserProfileService({ user: u, userProfile: authProfile });
      } catch (err) {
        console.warn("Falha ao carregar perfil do Firestore:", err);
      }

      setUserProfile(authProfile);
      setOriginalProfile(authProfile);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    return () => {
      if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
    };
  }, [pendingAvatarPreview]);

  const clearPendingAvatar = useCallback(() => {
    if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
    setPendingAvatarPreview("");
    setPendingAvatarFile(null);
  }, [pendingAvatarPreview]);

  const handleProfileImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    const input = e.target;
    if (!file || !user) return;

    try {
      if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
      const previewUrl = URL.createObjectURL(file);
      setPendingAvatarFile(file);
      setPendingAvatarPreview(previewUrl);
      setUserProfile(prev => ({ ...prev, photoURL: previewUrl }));
      if (originalProfile?.photoURL) {
        setAvatarToRemove(originalProfile.photoURL);
        setPendingAvatarRemoval(true);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao preparar avatar: " + err.message);
    } finally {
      if (input) input.value = "";
    }
  }, [user, pendingAvatarPreview, originalProfile]);

  const handleProfileImageRemove = useCallback(() => {
    if (!userProfile.photoURL) return;
    clearPendingAvatar();
    setAvatarToRemove(originalProfile?.photoURL || userProfile.photoURL);
    setPendingAvatarRemoval(true);
    setUserProfile(prev => ({ ...prev, photoURL: "" }));
  }, [userProfile.photoURL, originalProfile, clearPendingAvatar]);

  const resetProfileEditState = useCallback(() => {
    setPendingAvatarRemoval(false);
    setAvatarToRemove("");
    clearPendingAvatar();
  }, [clearPendingAvatar]);

  const saveUserProfile = useCallback(async () => {
    if (!user) return;
    setUploading(true);
    try {
      let nextProfile = userProfile;

      if (pendingAvatarFile) {
        const url = await uploadProfileAvatar({ user, file: pendingAvatarFile });
        nextProfile = { ...userProfile, photoURL: url };
        setUserProfile(nextProfile);
      }

      await saveUserProfileService({ user, userProfile: nextProfile });
      setOriginalProfile(nextProfile);

      if (pendingAvatarRemoval && avatarToRemove && avatarToRemove !== nextProfile.photoURL) {
        await deleteProfileAvatar(avatarToRemove);
      }

      resetProfileEditState();
      alert("Perfil atualizado!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar perfil: " + err.message);
    } finally {
      setUploading(false);
    }
  }, [
    user,
    userProfile,
    pendingAvatarFile,
    pendingAvatarRemoval,
    avatarToRemove,
    resetProfileEditState,
    setUploading
  ]);

  const hasProfileChanged = useCallback(() => {
    if (!originalProfile) return false;
    return originalProfile.displayName !== userProfile.displayName || originalProfile.photoURL !== userProfile.photoURL;
  }, [originalProfile, userProfile]);

  return {
    user,
    userProfile,
    setUserProfile,
    originalProfile,
    setOriginalProfile,
    editingProfile,
    setEditingProfile,
    handleProfileImageUpload,
    handleProfileImageRemove,
    resetProfileEditState,
    saveUserProfile,
    hasProfileChanged
  };
}
