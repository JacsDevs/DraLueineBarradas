import {
  FaCalendarAlt,
  FaComments,
  FaPlus,
  FaRegEdit,
  FaRegEye,
  FaRegNewspaper,
  FaReply,
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

function formatCommentDate(timestamp) {
  const date = toDate(timestamp);
  if (!date) return "Agora";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
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
  onPublishSelectedDrafts,
  onDeleteSelectedPosts,
  onEdit,
  onDelete,
  onPublishDraft,
  publishingDraftId,
  activeCommentsPostId = "",
  comments = [],
  commentsTotal = 0,
  commentsLoading = false,
  commentsError = "",
  replyParentId = "",
  replyMessage = "",
  submittingReply = false,
  deletingCommentId = "",
  onToggleComments = () => {},
  onStartReply = () => {},
  onCancelReply = () => {},
  onReplyMessageChange = () => {},
  onSubmitReply = () => {},
  onDeleteComment = () => {}
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
            {isDraftTab ? "Rascunhos" : "Conteúdos publicados"}
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
            const isCommentsOpen = activeCommentsPostId === post.id;

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
                  <button
                    type="button"
                    className={`comments-btn ${isCommentsOpen ? "is-active" : ""}`}
                    onClick={() => onToggleComments(post.id)}
                    disabled={isBusy}
                  >
                    <FaComments aria-hidden="true" />
                    {isCommentsOpen ? "Fechar comentarios" : "Comentarios"}
                  </button>

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

                {isCommentsOpen && (
                  <section className="post-comments-panel" aria-label="Comentarios do post">
                    <div className="post-comments-panel-head">
                      <strong>Comentarios</strong>
                      <span>{commentsTotal} {commentsTotal === 1 ? "comentario" : "comentarios"}</span>
                    </div>

                    {commentsLoading && (
                      <p className="post-comments-feedback">Carregando comentarios...</p>
                    )}

                    {!commentsLoading && commentsError && (
                      <p className="post-comments-feedback error">{commentsError}</p>
                    )}

                    {!commentsLoading && !commentsError && comments.length === 0 && (
                      <p className="post-comments-feedback">Nenhum comentario enviado para este post.</p>
                    )}

                    {!commentsLoading && !commentsError && comments.length > 0 && (
                      <ul className="admin-comments-list">
                        {comments.map((comment) => (
                          <li key={comment.id} className="admin-comment-item">
                            <article className="admin-comment-card">
                              <header className="admin-comment-head">
                                <div className="admin-comment-identity">
                                  <strong>{comment.name || "Visitante"}</strong>
                                  {comment.email && <small>{comment.email}</small>}
                                </div>

                                <div className="admin-comment-meta">
                                  {comment.isAdminReply && <span className="admin-comment-tag">Equipe</span>}
                                  <time>{formatCommentDate(comment.createdAt)}</time>
                                </div>
                              </header>

                              <p className="admin-comment-message">{comment.message}</p>

                              <div className="admin-comment-actions">
                                <button
                                  type="button"
                                  className="admin-comment-btn reply"
                                  onClick={() => onStartReply(comment.id)}
                                  disabled={isBusy || submittingReply}
                                >
                                  <FaReply aria-hidden="true" />
                                  {replyParentId === comment.id ? "Fechar resposta" : "Responder"}
                                </button>

                                <button
                                  type="button"
                                  className="admin-comment-btn delete"
                                  onClick={() => onDeleteComment(comment)}
                                  disabled={isBusy || deletingCommentId === comment.id}
                                >
                                  <FaTrashAlt aria-hidden="true" />
                                  {deletingCommentId === comment.id ? "Excluindo..." : "Excluir"}
                                </button>
                              </div>
                            </article>

                            {replyParentId === comment.id && (
                              <div className="admin-comment-reply-box">
                                <label htmlFor={`reply-${comment.id}`}>Resposta da equipe</label>
                                <textarea
                                  id={`reply-${comment.id}`}
                                  value={replyMessage}
                                  onChange={(event) => onReplyMessageChange(event.target.value)}
                                  maxLength={2000}
                                  disabled={submittingReply || isBusy}
                                />
                                <div className="admin-comment-reply-actions">
                                  <button
                                    type="button"
                                    className="admin-comment-btn submit"
                                    onClick={onSubmitReply}
                                    disabled={submittingReply || !replyMessage.trim() || isBusy}
                                  >
                                    {submittingReply ? "Enviando..." : "Enviar resposta"}
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-comment-btn cancel"
                                    onClick={onCancelReply}
                                    disabled={submittingReply || isBusy}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}

                            {comment.replies.length > 0 && (
                              <ul className="admin-comment-replies">
                                {comment.replies.map((reply) => (
                                  <li key={reply.id} className="admin-comment-reply-item">
                                    <article className="admin-comment-card reply">
                                      <header className="admin-comment-head">
                                        <div className="admin-comment-identity">
                                          <strong>{reply.name || "Visitante"}</strong>
                                          {reply.email && <small>{reply.email}</small>}
                                        </div>

                                        <div className="admin-comment-meta">
                                          {reply.isAdminReply && <span className="admin-comment-tag">Equipe</span>}
                                          <time>{formatCommentDate(reply.createdAt)}</time>
                                        </div>
                                      </header>

                                      <p className="admin-comment-message">{reply.message}</p>

                                      <div className="admin-comment-actions only-delete">
                                        <button
                                          type="button"
                                          className="admin-comment-btn delete"
                                          onClick={() => onDeleteComment(reply)}
                                          disabled={isBusy || deletingCommentId === reply.id}
                                        >
                                          <FaTrashAlt aria-hidden="true" />
                                          {deletingCommentId === reply.id ? "Excluindo..." : "Excluir resposta"}
                                        </button>
                                      </div>
                                    </article>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
