export default function PostList({ posts, onNewPost, onEdit, onDelete }) {
  return (
    <div className="posts-management">
      <h3>Gerenciar Posts</h3>
      <div className="posts-grid">
        <div className="post-card new-post" onClick={onNewPost}>
          <span>+ Novo Post</span>
        </div>
        {posts.map(post => (
          <div key={post.id} className="post-card">
            {post.featuredImage && <img src={post.featuredImage} alt={post.title} />}
            <div className="post-card-content">
              <strong>{post.title}</strong>
              <small>{new Date(post.date?.seconds * 1000).toLocaleDateString()}</small>
            </div>
            <div className="post-card-actions">
              <button className="edit-btn" onClick={() => onEdit(post)}>Editar</button>
              <button className="delete-btn" onClick={() => onDelete(post.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
