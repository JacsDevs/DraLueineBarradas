import { Link, useParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { useEffect, useState } from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaWhatsapp } from "react-icons/fa"; // ícones
import "../styles/postdetail.css";
import { Helmet } from "react-helmet-async";
import { buildPostSlugId, extractIdFromSlugId } from "../utils/slugify";

const buildSrcSet = (src) => (src ? `${src} 1x, ${src} 2x` : undefined);

export default function PostDetail() {
  const { slugId } = useParams();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState({ displayName: "", photoURL: "" });
  const [shareUrl, setShareUrl] = useState("");
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    async function load() {
      const id = extractIdFromSlugId(slugId);
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;
      const postData = postSnap.data();
      setPost({ id, ...postData });

      if (postData.authorId) {
        const userRef = doc(db, "users", postData.authorId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() || {};
          setAuthor(current => ({
            displayName: userData.displayName || current.displayName || "",
            photoURL: userData.photoURL || current.photoURL || ""
          }));
        }
      }
    }
    load();
  }, [slugId]);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, [slugId]);

  useEffect(() => {
    async function fetchRelatedPosts() {
      if (!post?.id) {
        setRelatedPosts([]);
        return;
      }
      const q = query(collection(db, "posts"), orderBy("date", "desc"), limit(6));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }));
      const filtered = list.filter(item => item.id !== post.id).slice(0, 3);
      setRelatedPosts(filtered);
    }
    fetchRelatedPosts();
  }, [post?.id]);

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
  const canonicalUrl = shareUrl || `${baseUrl}/post/${slugPath}`;
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
                <div className="author-photo author-photo-placeholder" aria-label="Avatar genérico">
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
          <div
            className="content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          ></div>
        </article>
        <section className="post-infos">
          <aside className="share-aside" aria-label="Compartilhar">
            <h2 className="share-title">Compartilhe</h2>
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
                )}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no Twitter"
              >
                <FaTwitter />
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
          </aside>
          {relatedPosts.length > 0 && (
            <div className="related-posts" aria-label="Outros posts">
              <h2 className="share-title">Outros posts</h2>
              <div className="related-grid">
                {relatedPosts.map(item => {
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




