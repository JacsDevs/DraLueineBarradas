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
    title,
    setTitle,
    summary,
    setSummary,
    content,
    setContent,
    featuredImage,
    featuredLinkDraft,
    handleFeaturedLinkChange,
    handleFeaturedLinkApply,
    clearFeaturedImage,
    handleFeaturedImageSelect,
    handleSavePost,
    handleDelete,
    startEdit,
    resetForm,
    fetchPosts
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
    updateSourceType
  } = useQuillUpload({ setUploading });

  useEffect(() => {
    if (user) fetchPosts();
  }, [user, fetchPosts]);

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
    const now = new Date();

    const formatDate = (timestamp) => {
      if (!timestamp?.seconds) return "--";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date(timestamp.seconds * 1000));
    };

    const totalPosts = posts.length;
    const postsThisMonth = posts.filter((post) => {
      if (!post.date?.seconds) return false;
      const publishDate = new Date(post.date.seconds * 1000);
      return (
        publishDate.getMonth() === now.getMonth()
        && publishDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const postsWithFeaturedImage = posts.filter((post) => Boolean(post.featuredImage)).length;
    const latestPost = posts.find((post) => Boolean(post.date?.seconds));

    return [
      {
        label: "Total de posts",
        value: String(totalPosts),
        note: totalPosts ? "Conteudos publicados" : "Nenhum conteudo publicado"
      },
      {
        label: "Publicados no mes",
        value: String(postsThisMonth),
        note: "Ritmo editorial atual"
      },
      {
        label: "Com imagem de capa",
        value: `${postsWithFeaturedImage}/${totalPosts || 0}`,
        note: "Padrao visual dos artigos"
      },
      {
        label: "Ultima publicacao",
        value: latestPost ? formatDate(latestPost.date) : "--",
        note: latestPost?.title || "Publique para atualizar este indicador"
      }
    ];
  }, [posts]);

  const hasDraftChanges = Boolean(title || summary || content || featuredImage);
  const hasProfilePhoto = Boolean(userProfile.photoURL);
  const editorActionTitle = isEditing ? "Editar post" : "Novo post";
  const editorActionDescription = isEditing
    ? "Revise o conteudo e atualize as informacoes antes de salvar."
    : "Estruture o conteudo com clareza para manter o blog organizado e consistente.";

  const handleOpenPostList = () => {
    if (showForm && hasDraftChanges && !window.confirm("Descartar alteracoes do post?")) return;
    resetForm();
    setShowForm(false);
    setIsSidebarOpen(false);
  };

  const handleOpenNewPost = () => {
    if (showForm && hasDraftChanges && !window.confirm("Descartar alteracoes do post?")) return;
    resetForm();
    setShowForm(true);
    setIsSidebarOpen(false);
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
    if (hasProfileChanged() && !window.confirm("Descartar alteracoes do perfil?")) return;
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
            className={`admin-side-btn ${!showForm ? "is-active" : ""}`}
            onClick={handleOpenPostList}
          >
            Gerenciar posts
          </button>
          <button
            type="button"
            className={`admin-side-btn ${showForm ? "is-active" : ""}`}
            onClick={handleOpenNewPost}
          >
            {isEditing ? "Editando post" : "Novo post"}
          </button>
        </nav>

        <div className="admin-sidebar-stats">
          {dashboardStats.slice(0, 3).map((item) => (
            <article key={item.label} className="admin-sidebar-stat">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="admin-logout admin-sidebar-logout"
          onClick={() => {
            setIsSidebarOpen(false);
            signOut(auth);
          }}
        >
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
              <span className="admin-chip">Area editorial</span>
              <h1>{editorActionTitle}</h1>
              <p>{editorActionDescription}</p>
            </header>
          ) : (
            <AdminHeader stats={dashboardStats} />
          )}

          {showForm && (
            <PostForm
              isEditing={isEditing}
              hideHeading
              title={title}
              summary={summary}
              content={content}
              featuredImage={featuredImage}
              featuredLinkDraft={featuredLinkDraft}
              uploading={uploading}
              onTitleChange={setTitle}
              onSummaryChange={setSummary}
              onContentChange={setContent}
              onFeaturedSelect={handleFeaturedImageSelect}
              onFeaturedLinkChange={handleFeaturedLinkChange}
              onFeaturedLinkApply={handleFeaturedLinkApply}
              onRemoveFeatured={clearFeaturedImage}
              onSavePost={handleSavePost}
              onCancel={() => {
                if (hasDraftChanges && !window.confirm("Descartar alteracoes do post?")) return;
                resetForm();
              }}
              quillRef={quillRef}
              quillModules={quillModules}
              quillFormats={quillFormats}
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
              onNewPost={handleOpenNewPost}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          )}
        </section>
      </div>
    </section>
  );
}
