import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import "../styles/admin.css";
import AdminHeader from "../components/admin/AdminHeader";
import PostForm from "../components/admin/PostForm";
import PostList from "../components/admin/PostList";
import { useAuthProfile } from "../hooks/useAuthProfile";
import { usePosts } from "../hooks/usePosts";
import { useQuillUpload } from "../hooks/useQuillUpload";

export default function Admin() {
  const [uploading, setUploading] = useState(false);

  const {
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
  } = useAuthProfile({ setUploading });

  const {
    posts,
    showForm,
    setShowForm,
    isEditing,
    title,
    setTitle,
    summary,
    setSummary,
    content,
    setContent,
    featuredImage,
    setFeaturedImage,
    featuredFile,
    setFeaturedFile,
    handleFeaturedImageSelect,
    handleSavePost,
    handleDelete,
    startEdit,
    resetForm,
    fetchPosts
  } = usePosts({ user, userProfile, setUploading });

  const { quillRef, quillModules, quillFormats } = useQuillUpload({ setUploading });

  useEffect(() => {
    if (user) fetchPosts();
  }, [user, fetchPosts]);

  if (!user) return <p className="loading-text">Carregando painel...</p>;

  return (
    <section className="admin-wrapper">
      <AdminHeader
        user={user}
        userProfile={userProfile}
        editingProfile={editingProfile}
        onStartEditProfile={() => { setOriginalProfile(userProfile); resetProfileEditState(); setEditingProfile(true); }}
        onCancelEditProfile={() => {
          if (hasProfileChanged() && !window.confirm("Descartar alterações do perfil?")) return;
          setUserProfile(originalProfile);
          resetProfileEditState();
          setEditingProfile(false);
        }}
        onSaveProfile={async () => { await saveUserProfile(); setEditingProfile(false); }}
        onProfileChange={setUserProfile}
        onProfileImageChange={handleProfileImageUpload}
        onProfileImageRemove={handleProfileImageRemove}
        hasProfileChanged={hasProfileChanged}
        uploading={uploading}
        onSignOut={() => signOut(auth)}
      />

      {showForm && (
        <PostForm
          isEditing={isEditing}
          title={title}
          summary={summary}
          content={content}
          featuredImage={featuredImage}
          featuredFile={featuredFile}
          uploading={uploading}
          onTitleChange={setTitle}
          onSummaryChange={setSummary}
          onContentChange={setContent}
          onFeaturedSelect={handleFeaturedImageSelect}
          onRemoveFeatured={() => { setFeaturedImage(""); setFeaturedFile(null); }}
          onSavePost={handleSavePost}
          onCancel={() => {
            const hasChanges = title || summary || content || featuredImage;
            if (hasChanges && !window.confirm("Descartar alterações do post?")) return;
            resetForm();
          }}
          quillRef={quillRef}
          quillModules={quillModules}
          quillFormats={quillFormats}
        />
      )}

      {!showForm && (
        <PostList
          posts={posts}
          onNewPost={() => { resetForm(); setShowForm(true); }}
          onEdit={startEdit}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}

