import { Link, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaFacebookF, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import "../styles/postdetail.css";
import { Helmet } from "react-helmet-async";
import { buildPostSlugId, extractIdFromSlugId } from "../utils/slugify";
import { isDraftPost, isPublishedPost } from "../utils/postStatus";
import { sanitizeRichHtml } from "../utils/sanitizeHtml";

const buildSrcSet = (src) => (src ? `${src} 1x, ${src} 2x` : undefined);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const commentDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

const slugifyHeading = (text) => text
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-");

const formatCommentDate = (timestamp) => {
  if (!timestamp?.seconds) return "Agora";
  return commentDateFormatter.format(new Date(timestamp.seconds * 1000));
};

const buildCommentThreads = (items) => {
  const topLevel = [];
  const repliesByParent = new Map();

  items.forEach((item) => {
    if (item.parentId) {
      const current = repliesByParent.get(item.parentId) || [];
      current.push(item);
      repliesByParent.set(item.parentId, current);
      return;
    }
    topLevel.push(item);
  });

  return topLevel.map((item) => ({
    ...item,
    replies: repliesByParent.get(item.id) || []
  }));
};

function CommentForm({
  onSubmit,
  submitLabel,
  compact = false,
  onCancel = null
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setError("Nome, email e comentário sao obrigatorios.");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError("Digite um email valido.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: trimmedName.slice(0, 80),
        email: trimmedEmail.slice(0, 120),
        message: trimmedMessage.slice(0, 2000)
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch (submitError) {
      setError(submitError?.message || "Não foi possivel enviar agora.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={`comment-form${compact ? " compact" : ""}`} onSubmit={handleSubmit}>
      <div className="comment-form-grid">
        <label className="comment-form-field">
          Nome
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
          />
        </label>

        <label className="comment-form-field">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={120}
            required
          />
        </label>

        <label className="comment-form-field full-width">
          Comentário
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={2000}
            required
          />
        </label>
      </div>

      {error && (
        <p className="comment-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="comment-form-actions">
        <button type="submit" className="comment-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            className="comment-cancel-btn"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function ShareButtons({
  withTitle = false,
  className = "",
  shareText,
  canonicalUrl,
  postTitle
}) {
  return (
    <div className={className}>
      {withTitle && <h2 className="share-title">Compartilhe</h2>}
      <div className="share-buttons">
        <a
          href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(canonicalUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no WhatsApp"
        >
          <FaWhatsapp />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            canonicalUrl
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no Facebook"
        >
          <FaFacebookF />
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
            canonicalUrl
          )}&text=${encodeURIComponent(postTitle)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no Twitter"
        >
          <FaXTwitter />
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            canonicalUrl
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no LinkedIn"
        >
          <FaLinkedinIn />
        </a>
      </div>
    </div>
  );
}

export default function PostDetail() {
  const { slugId } = useParams();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState({ displayName: "", photoURL: "" });
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [activeReplyId, setActiveReplyId] = useState("");

  useEffect(() => {
    async function load() {
      const id = extractIdFromSlugId(slugId);
      if (!id) {
        setPost(null);
        return;
      }

      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) {
        setPost(null);
        return;
      }

      const postData = postSnap.data();
      if (isDraftPost(postData)) {
        setPost(null);
        return;
      }

      setPost({ id, ...postData });
      setAuthor({ displayName: "", photoURL: "" });

      if (postData.authorId) {
        const userRef = doc(db, "users", postData.authorId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() || {};
          setAuthor({
            displayName: userData.displayName || "",
            photoURL: userData.photoURL || ""
          });
        }
      }
    }

    load();
  }, [slugId]);

  useEffect(() => {
    async function fetchRelatedPosts() {
      if (!post?.id) {
        setRelatedPosts([]);
        return;
      }
      const q = query(collection(db, "posts"), orderBy("date", "desc"), limit(24));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));
      const filtered = list
        .filter((item) => isPublishedPost(item) && item.id !== post.id)
        .slice(0, 3);
      setRelatedPosts(filtered);
    }

    fetchRelatedPosts();
  }, [post?.id]);

  useEffect(() => {
    let unsubscribe = () => {};

    async function startCommentsSubscription() {
      if (!post?.id) {
        setComments([]);
        setCommentsLoading(false);
        setCommentsError("");
        setActiveReplyId("");
        return;
      }

      setComments([]);
      setCommentsLoading(true);
      setCommentsError("");

      const commentsRef = collection(db, "posts", post.id, "comments");
      const commentsQuery = query(commentsRef, orderBy("createdAt", "asc"));

      unsubscribe = onSnapshot(
        commentsQuery,
        (snapshot) => {
          const list = snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data()
          }));

          setComments(buildCommentThreads(list));
          setCommentsLoading(false);
        },
        (error) => {
          console.error(error);
          setComments([]);
          setCommentsLoading(false);
          setCommentsError("Nao foi possivel carregar os comentários.");
        }
      );
    }

    startCommentsSubscription();

    return () => {
      unsubscribe();
    };
  }, [post?.id]);

  const { contentHtml, tocItems } = useMemo(() => {
    if (!post?.content) return { contentHtml: "", tocItems: [] };

    const safeContent = sanitizeRichHtml(post.content);
    const parser = new DOMParser();
    const doc = parser.parseFromString(safeContent, "text/html");
    const headings = Array.from(doc.querySelectorAll("h2, h3, h4"));
    const counts = new Map();
    const items = headings.map((heading) => {
      const text = (heading.textContent || "").trim();
      if (!text) return null;
      const base = slugifyHeading(text) || "secao";
      const count = counts.get(base) ?? 0;
      const id = count ? `${base}-${count}` : base;
      counts.set(base, count + 1);
      heading.setAttribute("id", id);
      return {
        id,
        text,
        level: Number(heading.tagName.slice(1))
      };
    }).filter(Boolean);

    return { contentHtml: sanitizeRichHtml(doc.body.innerHTML), tocItems: items };
  }, [post]);

  const submitComment = useCallback(async (payload) => {
    if (!post?.id) {
      throw new Error("Post indisponivel no momento.");
    }

    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        name: payload.name,
        email: payload.email.toLowerCase(),
        message: payload.message,
        parentId: payload.parentId || null,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
      throw new Error("Nao foi possivel enviar seu comentário agora.");
    }
  }, [post]);

  const totalComments = useMemo(
    () => comments.reduce((acc, item) => acc + 1 + item.replies.length, 0),
    [comments]
  );

  if (!post) {
    return (
      <>
        <div className="skeleton skeleton-img" />
        <section className="post-detail">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" style={{ width: "60%" }} />
        </section>
      </>
    );
  }

  const baseUrl = "https://dralueinebarradas.com.br";
  const slugPath = buildPostSlugId({ title: post.title, id: post.id, slug: post.slug });
  const canonicalUrl = typeof window !== "undefined"
    ? window.location.href
    : `${baseUrl}/post/${slugPath}`;
  const shareText = encodeURIComponent(`Confira este post: ${post.title}`);
  const rawDescription = post.summary || post.content || "";
  const metaDescription = rawDescription
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155);
  const authorName = author.displayName || "Dra. Lueine Barradas";
  const publishedIso = post?.date?.seconds
    ? new Date(post.date.seconds * 1000).toISOString()
    : null;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: metaDescription,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    author: {
      "@type": "Person",
      name: authorName
    },
    publisher: {
      "@type": "Organization",
      name: "Dra. Lueine Barradas",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/favicon.ico`
      }
    },
    datePublished: publishedIso || undefined,
    dateModified: publishedIso || undefined,
    mainEntityOfPage: canonicalUrl
  };

  const formattedDate = post?.date?.seconds
    ? new Date(post.date.seconds * 1000).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "";

  return (
    <>
      <Helmet>
        <title>{post.title} | Dra. Lueine Barradas</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {post.featuredImage && (
          <meta property="og:image" content={post.featuredImage} />
        )}
        {publishedIso && (
          <meta property="article:published_time" content={publishedIso} />
        )}
        <meta property="article:author" content={authorName} />
        <meta
          name="twitter:card"
          content={post.featuredImage ? "summary_large_image" : "summary"}
        />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>

      {post.featuredImage && (
        <div className="featured-image-full">
          <img
            src={post.featuredImage}
            srcSet={buildSrcSet(post.featuredImage)}
            sizes="100vw"
            alt={post.title}
          />
        </div>
      )}

      <div className="post-body">
        <article className="post-detail" aria-live="polite">
          <h1>{post.title}</h1>
          <p className="description">{post.summary}</p>

          <div className="meta">
            <div className="author">
              {author.photoURL ? (
                <img src={author.photoURL} alt={author.displayName} className="author-photo" />
              ) : (
                <div className="author-photo author-photo-placeholder" aria-label="Avatar generico">
                  <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
                    <circle cx="32" cy="24" r="14" />
                    <path d="M12 58c4-12 16-18 20-18s16 6 20 18" />
                  </svg>
                </div>
              )}

              <div className="author-info">
                <span className="author-name">
                  Publicado por {authorName}
                </span>
                <span className="author-date">
                  em {formattedDate}
                </span>
              </div>
            </div>
          </div>
          <ShareButtons
            className="share-inline"
            shareText={shareText}
            canonicalUrl={canonicalUrl}
            postTitle={post.title}
          />
          {tocItems.length > 0 && (
            <nav className="post-toc" aria-label="O que ha no texto">
              <h2 className="toc-title">O que há no texto?</h2>
              <ul className="toc-list">
                {tocItems.map((item) => (
                  <li key={item.id} className={`toc-item level-${item.level}`}>
                    <a href={`#${item.id}`}>{item.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div
            className="content"
            dangerouslySetInnerHTML={{ __html: contentHtml || post.content }}
          />

          <section className="comments-section" aria-labelledby="comments-title">
            <div className="comments-header">
              <h2 id="comments-title">Deixe seu comentário</h2>
              <span className="comments-count">
                {totalComments} {totalComments === 1 ? "comentário" : "comentários"}
              </span>
            </div>

            <p className="comments-description">
              Preencha nome, email e comentário para publicar. Seu email não será exibido.
            </p>

            <CommentForm
              submitLabel="Publicar comentário"
              onSubmit={(payload) => submitComment({ ...payload, parentId: null })}
            />

            <div className="comments-list-wrapper">
              {commentsLoading && (
                <p className="comments-feedback">Carregando comentários...</p>
              )}

              {!commentsLoading && commentsError && (
                <p className="comments-feedback comments-feedback-error">
                  {commentsError}
                </p>
              )}

              {!commentsLoading && !commentsError && comments.length === 0 && (
                <p className="comments-feedback">
                  Nenhum comentário ainda. Seja a primeira pessoa a comentar.
                </p>
              )}

              {!commentsLoading && !commentsError && comments.length > 0 && (
                <ul className="comments-list">
                  {comments.map((comment) => (
                    <li className="comment-item" key={comment.id}>
                      <article className="comment-card">
                        <header className="comment-head">
                          <strong>{comment.name}</strong>
                          <time>{formatCommentDate(comment.createdAt)}</time>
                        </header>
                        <p className="comment-message">{comment.message}</p>
                        <button
                          type="button"
                          className="comment-reply-toggle"
                          onClick={() => setActiveReplyId((current) => (
                            current === comment.id ? "" : comment.id
                          ))}
                        >
                          {activeReplyId === comment.id ? "Fechar resposta" : "Responder"}
                        </button>
                      </article>

                      {activeReplyId === comment.id && (
                        <CommentForm
                          compact
                          submitLabel="Enviar resposta"
                          onCancel={() => setActiveReplyId("")}
                          onSubmit={async (payload) => {
                            await submitComment({ ...payload, parentId: comment.id });
                            setActiveReplyId("");
                          }}
                        />
                      )}

                      {comment.replies.length > 0 && (
                        <ul className="comment-replies">
                          {comment.replies.map((reply) => (
                            <li className="comment-item reply" key={reply.id}>
                              <article className="comment-card">
                                <header className="comment-head">
                                  <strong>{reply.name}</strong>
                                  <time>{formatCommentDate(reply.createdAt)}</time>
                                </header>
                                <p className="comment-message">{reply.message}</p>
                              </article>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </article>

        <section className="post-infos">
          <aside className="share-aside" aria-label="Compartilhar">
            <ShareButtons
              withTitle
              shareText={shareText}
              canonicalUrl={canonicalUrl}
              postTitle={post.title}
            />
          </aside>
          {relatedPosts.length > 0 && (
            <div className="related-posts" aria-label="Outros posts">
              <h2 className="share-title">Outros posts</h2>
              <div className="related-grid">
                {relatedPosts.map((item) => {
                  const postUrl = `/post/${buildPostSlugId({
                    title: item.title,
                    id: item.id,
                    slug: item.slug
                  })}`;
                  return (
                    <article className="related-card" key={item.id}>
                      {item.featuredImage && (
                        <img
                          src={item.featuredImage}
                          srcSet={buildSrcSet(item.featuredImage)}
                          sizes="(max-width: 768px) 100vw, 33vw"
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="related-content">
                        <h3>
                          <Link to={postUrl}>{item.title}</Link>
                        </h3>
                        <p>{item.summary}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
