import { useState, useEffect, useMemo, useRef } from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import "../styles/admin.css";
import AdminHeader from "../components/admin/AdminHeader";
import PostForm from "../components/admin/PostForm";
import PostList from "../components/admin/PostList";
import { useAuthProfile } from "../hooks/useAuthProfile";
import { usePosts } from "../hooks/usePosts";
import { useQuillUpload } from "../hooks/useQuillUpload";
import { POST_STATUSES, timestampToMillis } from "../utils/postStatus";
import {
  FaRegEdit,
  FaRegFileAlt,
  FaRegNewspaper,
  FaSignOutAlt,
  FaPlus
} from "react-icons/fa";

export default function Admin() {
  const [uploading, setUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const profileFileInputRef = useRef(null);

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
    editingStatus,
    activePostTab,
    setActivePostTab,
    postTotals,
    postStats,
    postsLoading,
    title,
    setTitle,
    summary,
    setSummary,
    content,
    setContent,
    featuredImage,
    featuredLinkDraft,
    canPublish,
    canSaveDraft,
    publishingDraftId,
    bulkActionType,
    selectedPostIds,
    selectedPostsCount,
    allVisiblePostsSelected,
    handleFeaturedLinkChange,
    handleFeaturedLinkApply,
    clearFeaturedImage,
    togglePostSelection,
    toggleSelectAllPosts,
    handleFeaturedImageSelect,
    handleSavePost,
    handlePublishDraft,
    handlePublishSelectedDrafts,
    handleDelete,
    handleDeleteSelectedPosts,
    startEdit,
    resetForm
  } = usePosts({ user, setUploading });

  const {
    quillRef,
    quillModules,
    quillFormats,
    mediaModal,
    closeModal,
    submitModal,
    updateField,
    updateFile,
    updateSourceType,
    attachToolbarTooltips
  } = useQuillUpload({ setUploading });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const handleViewportChange = (event) => {
      if (!event.matches) setIsSidebarOpen(false);
    };

    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    if (!window.matchMedia("(max-width: 760px)").matches) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen]);

  const dashboardStats = useMemo(() => {
    const formatDate = (timestamp) => {
      const millis = timestampToMillis(timestamp);
      if (!millis) return "--";

      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date(millis));
    };

    const totalPosts = postStats.totalPublished;
    const draftsTotal = postStats.totalDrafts;
    const postsThisMonth = postStats.postsThisMonth;
    const latestPost = postStats.latestPublishedPost;

    return [
      {
        icon: "posts",
        label: "Total de posts",
        value: String(totalPosts),
        note: totalPosts ? "Conteúdos publicados" : "Nenhum conteúdo publicado"
      },
      {
        icon: "drafts",
        label: "Rascunhos",
        value: String(draftsTotal),
        note: draftsTotal ? "Conteúdos em preparação" : "Nenhum rascunho salvo"
      },
      {
        icon: "month",
        label: "Publicados no mês",
        value: String(postsThisMonth),
        note: "Ritmo editorial atual"
      },
      {
        icon: "latest",
        label: "Última publicação",
        value: latestPost ? formatDate(latestPost.publishedAt || latestPost.date) : "--",
        note: latestPost?.title || "Publique para atualizar este indicador"
      }
    ];
  }, [postStats]);

  const hasDraftChanges = Boolean(title || summary || content || featuredImage);
  const hasProfilePhoto = Boolean(userProfile.photoURL);
  const editorActionTitle = isEditing
    ? (editingStatus === POST_STATUSES.DRAFT ? "Editar rascunho" : "Editar post")
    : "Novo post";
  const editorActionDescription = isEditing
    ? "Revise o conteúdo e atualize as informações antes de salvar."
    : "Estruture o conteúdo com clareza para manter o blog organizado e consistente.";

  const handleOpenPostList = (tab = "published") => {
    if (showForm && hasDraftChanges && !window.confirm("Descartar alterações do post?")) return;
    resetForm();
    setActivePostTab(tab);
    setShowForm(false);
    setIsSidebarOpen(false);
  };

  const handleOpenNewPost = () => {
    if (showForm && hasDraftChanges && !window.confirm("Descartar alterações do post?")) return;
    resetForm();
    setShowForm(true);
    setIsSidebarOpen(false);
  };

  const handleSavePublishedFromForm = async () => {
    await handleSavePost(POST_STATUSES.PUBLISHED);
  };

  const handleSaveDraftFromForm = async () => {
    await handleSavePost(POST_STATUSES.DRAFT);
  };

  const handlePickProfileFile = () => {
    if (profileFileInputRef.current) profileFileInputRef.current.click();
  };

  const handleStartProfileEdit = () => {
    setOriginalProfile(userProfile);
    resetProfileEditState();
    setEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    if (hasProfileChanged() && !window.confirm("Descartar alterações do perfil?")) return;
    setUserProfile(originalProfile);
    resetProfileEditState();
    setEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    await saveUserProfile();
    setEditingProfile(false);
  };

  if (!user) return <p className="loading-text">Carregando painel...</p>;

  return (
    <section className="admin-shell">
      <aside id="admin-sidebar-menu" className={`admin-sidebar ${isSidebarOpen ? "is-open" : ""}`}>
        <div className={`user-profile admin-sidebar-profile ${editingProfile ? "editing" : ""}`}>
          <div className="avatar-wrapper">
            {hasProfilePhoto ? (
              <img src={userProfile.photoURL} alt="Avatar" className="avatar" />
            ) : (
              <div className="avatar avatar-fallback" aria-label="Avatar padrao">
                <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
                  <circle cx="32" cy="24" r="14" />
                  <path d="M12 58c4-12 16-18 20-18s16 6 20 18" />
                </svg>
              </div>
            )}
            {editingProfile && hasProfilePhoto && (
              <button
                type="button"
                className="avatar-action remove"
                onClick={handleProfileImageRemove}
                aria-label="Remover foto"
              >
                x
              </button>
            )}
            {editingProfile && !hasProfilePhoto && (
              <button
                type="button"
                className="avatar-action add"
                onClick={handlePickProfileFile}
                aria-label="Adicionar foto"
              >
                +
              </button>
            )}
            {editingProfile && (
              <input
                ref={profileFileInputRef}
                type="file"
                accept="image/*"
                className="avatar-input"
                onChange={handleProfileImageUpload}
              />
            )}
          </div>
          <div className="user-info">
            {!editingProfile ? (
              <>
                <strong className="user-name">{userProfile.displayName || user.email}</strong>
                <small className="user-email">{user.email}</small>
                <button type="button" className="edit-profile-link" onClick={handleStartProfileEdit}>Editar perfil</button>
              </>
            ) : (
              <>
                <label className="profile-input-label" htmlFor="sidebar-profile-display-name">Nome exibido</label>
                <input
                  id="sidebar-profile-display-name"
                  type="text"
                  placeholder="Seu nome"
                  value={userProfile.displayName}
                  onChange={(e) => setUserProfile({ ...userProfile, displayName: e.target.value })}
                />
                <div className="profile-actions">
                  <button
                    type="button"
                    className="admin-btn primary"
                    disabled={!hasProfileChanged() || uploading}
                    onClick={handleSaveProfile}
                  >
                    {uploading ? "Enviando..." : "Salvar perfil"}
                  </button>
                  <button type="button" className="admin-btn cancel" onClick={handleCancelProfileEdit}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Navegacao do painel">
          <button
            type="button"
            className={`admin-side-btn ${!showForm && activePostTab === "published" ? "is-active" : ""}`}
            onClick={() => handleOpenPostList("published")}
          >
            <FaRegNewspaper className="side-btn-icon" aria-hidden="true" />
            Gerenciar posts
          </button>
          <button
            type="button"
            className={`admin-side-btn ${!showForm && activePostTab === "drafts" ? "is-active" : ""}`}
            onClick={() => handleOpenPostList("drafts")}
          >
            <FaRegEdit className="side-btn-icon" aria-hidden="true" />
            Rascunhos
          </button>
          <button
            type="button"
            className={`admin-side-btn ${showForm ? "is-active" : ""}`}
            onClick={handleOpenNewPost}
          >
            <FaPlus className="side-btn-icon" aria-hidden="true" />
            {isEditing ? (editingStatus === POST_STATUSES.DRAFT ? "Editando rascunho" : "Editando post") : "Novo post"}
          </button>
        </nav>

        <button
          type="button"
          className="admin-logout admin-sidebar-logout"
          onClick={() => {
            setIsSidebarOpen(false);
            signOut(auth);
          }}
        >
          <FaSignOutAlt aria-hidden="true" />
          Sair
        </button>
      </aside>
      <div
        className={`admin-sidebar-overlay ${isSidebarOpen ? "is-visible" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      <div className="admin-content">
        <section className="admin-wrapper">
          <button
            type="button"
            className={`admin-mobile-menu-btn ${isSidebarOpen ? "is-open" : ""}`}
            aria-controls="admin-sidebar-menu"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((current) => !current)}
            aria-label={isSidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
          >
            <span className="admin-hamburger-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          {showForm ? (
            <header className="admin-editor-header">
              <span className="admin-chip">
                <FaRegFileAlt aria-hidden="true" />
                Área editorial
              </span>
              <h1>{editorActionTitle}</h1>
              <p>{editorActionDescription}</p>
            </header>
          ) : (
            <AdminHeader stats={dashboardStats} />
          )}

          {showForm && (
            <PostForm
              isEditing={isEditing}
              editingStatus={editingStatus}
              hideHeading
              title={title}
              summary={summary}
              content={content}
              featuredImage={featuredImage}
              featuredLinkDraft={featuredLinkDraft}
              canPublish={canPublish}
              canSaveDraft={canSaveDraft}
              uploading={uploading}
              onTitleChange={setTitle}
              onSummaryChange={setSummary}
              onContentChange={setContent}
              onFeaturedSelect={handleFeaturedImageSelect}
              onFeaturedLinkChange={handleFeaturedLinkChange}
              onFeaturedLinkApply={handleFeaturedLinkApply}
              onRemoveFeatured={clearFeaturedImage}
              onSavePost={handleSavePublishedFromForm}
              onSaveDraft={handleSaveDraftFromForm}
              onCancel={() => {
                if (hasDraftChanges && !window.confirm("Descartar alterações do post?")) return;
                resetForm();
              }}
              quillRef={quillRef}
              quillModules={quillModules}
              quillFormats={quillFormats}
              onAttachQuillTooltips={attachToolbarTooltips}
              mediaModal={mediaModal}
              onMediaClose={closeModal}
              onMediaSubmit={submitModal}
              onMediaFieldChange={updateField}
              onMediaFileChange={updateFile}
              onMediaSourceTypeChange={updateSourceType}
            />
          )}

          {!showForm && (
            <PostList
              posts={posts}
              activeTab={activePostTab}
              totals={postTotals}
              isLoading={postsLoading || postStats.loading}
              bulkActionType={bulkActionType}
              selectedPostIds={selectedPostIds}
              selectedPostsCount={selectedPostsCount}
              allVisiblePostsSelected={allVisiblePostsSelected}
              onTabChange={setActivePostTab}
              onNewPost={handleOpenNewPost}
              onTogglePostSelection={togglePostSelection}
              onToggleSelectAllPosts={toggleSelectAllPosts}
              onPublishSelectedDrafts={handlePublishSelectedDrafts}
              onDeleteSelectedPosts={handleDeleteSelectedPosts}
              onEdit={startEdit}
              onDelete={handleDelete}
              onPublishDraft={handlePublishDraft}
              publishingDraftId={publishingDraftId}
            />
          )}
        </section>
      </div>
    </section>
  );
}
