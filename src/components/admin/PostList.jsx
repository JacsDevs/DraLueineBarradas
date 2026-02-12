function formatPostDate(timestamp) {
  if (!timestamp?.seconds) return "Data nao informada";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(timestamp.seconds * 1000));
}

function compactSummary(summary) {
  const normalized = (summary || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Sem resumo cadastrado.";
  if (normalized.length <= 120) return normalized;
  return `${normalized.slice(0, 117)}...`;
}

export default function PostList({ posts, onNewPost, onEdit, onDelete }) {
  return (
    <div className="posts-management">
      <div className="posts-header">
        <div className="posts-title-group">
          <h3>Conteudos publicados</h3>
          <p>{posts.length} {posts.length === 1 ? "post cadastrado" : "posts cadastrados"}</p>
        </div>
        <button type="button" className="admin-btn primary posts-new-btn" onClick={onNewPost}>+ Novo post</button>
      </div>

      {!posts.length ? (
        <div className="posts-empty">
          <strong>Nenhum post publicado</strong>
          <p>Crie seu primeiro conteudo para iniciar o dashboard editorial.</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              <div className="post-card-media">
                {post.featuredImage ? (
                  <img src={post.featuredImage} alt={post.title || "Imagem do post"} />
                ) : (
                  <div className="post-card-placeholder">Sem capa</div>
                )}
              </div>

              <div className="post-card-content">
                <strong className="post-card-title">{post.title || "Post sem titulo"}</strong>
                <p className="post-card-summary">{compactSummary(post.summary)}</p>
                <div className="post-card-meta">
                  <small>{formatPostDate(post.date)}</small>
                  <span className={`post-status ${post.featuredImage ? "ok" : "warning"}`}>
                    {post.featuredImage ? "Com capa" : "Sem capa"}
                  </span>
                </div>
              </div>

              <div className="post-card-actions">
                <button type="button" className="edit-btn" onClick={() => onEdit(post)}>Editar</button>
                <button type="button" className="delete-btn" onClick={() => onDelete(post.id)}>Excluir</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
