import {
  FaCalendarAlt,
  FaPlus,
  FaRegEdit,
  FaRegEye,
  FaRegNewspaper,
  FaTrashAlt,
  FaUpload
} from "react-icons/fa";

function toDate(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === "function") return timestamp.toDate();
  if (typeof timestamp.seconds === "number") return new Date(timestamp.seconds * 1000);
  if (timestamp instanceof Date) return timestamp;
  return null;
}

function formatPostDate(timestamp) {
  const date = toDate(timestamp);
  if (!date) return "Data nao informada";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function compactSummary(summary) {
  const normalized = (summary || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Sem resumo cadastrado.";
  if (normalized.length <= 120) return normalized;
  return `${normalized.slice(0, 117)}...`;
}

function getPostDisplayTimestamp(post) {
  return post?.publishedAt || post?.date || post?.updatedAt || post?.createdAt || null;
}

export default function PostList({
  posts,
  activeTab,
  totals,
  isLoading,
  bulkActionType,
  selectedPostIds,
  selectedPostsCount,
  allVisiblePostsSelected,
  onTabChange,
  onNewPost,
  onTogglePostSelection,
  onToggleSelectAllPosts,
  onClearSelectedPosts,
  onPublishSelectedDrafts,
  onDeleteSelectedPosts,
  onEdit,
  onDelete,
  onPublishDraft,
  publishingDraftId
}) {
  const isDraftTab = activeTab === "drafts";
  const isBulkPublishing = bulkActionType === "publish";
  const isBulkDeleting = bulkActionType === "delete";
  const isBusy = isLoading || isBulkPublishing || isBulkDeleting;
  const totalItems = isDraftTab ? (totals?.drafts || 0) : (totals?.published || 0);
  const itemLabel = isDraftTab
    ? (totalItems === 1 ? "rascunho salvo" : "rascunhos salvos")
    : (totalItems === 1 ? "post cadastrado" : "posts cadastrados");

  return (
    <div className="posts-management">
      <div className="posts-header">
        <div className="posts-title-group">
          <h3>
            {isDraftTab ? <FaRegEdit aria-hidden="true" /> : <FaRegNewspaper aria-hidden="true" />}
            {isDraftTab ? "Rascunhos" : "Conteudos publicados"}
          </h3>
          <p>{totalItems} {itemLabel}</p>
        </div>

        <button type="button" className="admin-btn primary posts-new-btn" onClick={onNewPost}>
          <FaPlus aria-hidden="true" />
          Novo post
        </button>
      </div>

      <div className="posts-tabs" role="tablist" aria-label="Categorias de posts">
        <button
          type="button"
          role="tab"
          aria-selected={!isDraftTab}
          className={`posts-tab-btn ${!isDraftTab ? "is-active" : ""}`}
          onClick={() => onTabChange("published")}
        >
          <FaRegEye className="tab-icon" aria-hidden="true" />
          Publicados
          <span>{totals?.published || 0}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isDraftTab}
          className={`posts-tab-btn ${isDraftTab ? "is-active" : ""}`}
          onClick={() => onTabChange("drafts")}
        >
          <FaRegEdit className="tab-icon" aria-hidden="true" />
          Rascunhos
          <span>{totals?.drafts || 0}</span>
        </button>
      </div>

      {!!posts.length && (
        <div className="posts-bulk-bar">
          <label className="bulk-select-all">
            <input
              type="checkbox"
              checked={allVisiblePostsSelected}
              onChange={onToggleSelectAllPosts}
              disabled={isBusy}
            />
            Selecionar todos
          </label>
          <span className="bulk-selected-count">
            {selectedPostsCount} {selectedPostsCount === 1 ? "selecionado" : "selecionados"}
          </span>
          <div className="bulk-actions">
            {isDraftTab && (
              <button
                type="button"
                className="bulk-btn publish"
                onClick={onPublishSelectedDrafts}
                disabled={!selectedPostsCount || isBusy}
              >
                <FaUpload aria-hidden="true" />
                {isBulkPublishing ? "Publicando..." : "Publicar selecionados"}
              </button>
            )}
            <button
              type="button"
              className="bulk-btn delete"
              onClick={onDeleteSelectedPosts}
              disabled={!selectedPostsCount || isBusy}
            >
              <FaTrashAlt aria-hidden="true" />
              {isBulkDeleting ? "Excluindo..." : "Excluir selecionados"}
            </button>
            <button
              type="button"
              className="bulk-btn clear"
              onClick={onClearSelectedPosts}
              disabled={!selectedPostsCount || isBusy}
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {isLoading && !posts.length ? (
        <div className="posts-empty">
          <strong>Carregando posts...</strong>
          <p>Aguarde enquanto buscamos os resultados desta pagina.</p>
        </div>
      ) : !posts.length ? (
        <div className="posts-empty">
          <strong>{isDraftTab ? "Nenhum rascunho salvo" : "Nenhum post publicado"}</strong>
          <p>
            {isDraftTab
              ? "Salve rascunhos para revisar antes de publicar."
              : "Crie seu primeiro conteudo para iniciar o dashboard editorial."}
          </p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => {
            const isSelected = selectedPostIds.includes(post.id);

            return (
              <article key={post.id} className={`post-card ${isSelected ? "is-selected" : ""}`}>
                <label className="post-select-control" aria-label={`Selecionar ${post.title || "post"}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onTogglePostSelection(post.id)}
                    disabled={isBusy}
                  />
                </label>

              <div className="post-card-media">
                {post.featuredImage ? (
                  <img src={post.featuredImage} alt={post.title || "Imagem do post"} />
                ) : (
                  <div className="post-card-placeholder">Sem imagem</div>
                )}
              </div>

              <div className="post-card-content">
                <strong className="post-card-title">{post.title || "Post sem titulo"}</strong>
                <p className="post-card-summary">{compactSummary(post.summary)}</p>
                <div className="post-card-meta">
                  <small>
                    <FaCalendarAlt aria-hidden="true" />
                    {formatPostDate(getPostDisplayTimestamp(post))}
                  </small>
                </div>
              </div>

              <div className="post-card-actions">
                {isDraftTab && (
                  <button
                    type="button"
                    className="publish-btn"
                    onClick={() => onPublishDraft(post.id)}
                    disabled={publishingDraftId === post.id || isBusy}
                  >
                    <FaUpload aria-hidden="true" />
                    {publishingDraftId === post.id ? "Publicando..." : "Publicar"}
                  </button>
                )}
                <button type="button" className="edit-btn" onClick={() => onEdit(post)} disabled={isBusy}>
                  <FaRegEdit aria-hidden="true" />
                  Editar
                </button>
                <button type="button" className="delete-btn" onClick={() => onDelete(post.id)} disabled={isBusy}>
                  <FaTrashAlt aria-hidden="true" />
                  Excluir
                </button>
              </div>
            </article>
            );
          })}
        </div>
      )}

    </div>
  );
}
