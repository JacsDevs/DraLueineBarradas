import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useEffect, useState } from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaWhatsapp, FaInstagram } from "react-icons/fa"; // ícones
import "../styles/postdetail.css";

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState({ displayName: "", photoURL: "" });

  useEffect(() => {
    async function load() {
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;
      const postData = postSnap.data();
      setPost(postData);

      if (postData.authorId) {
        const userRef = doc(db, "admuser", postData.authorId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setAuthor(userSnap.data());
        }
      }
    }
    load();
  }, [id]);

  if (!post) {
    return (
      <>
        <div className="skeleton skeleton-img" />
        <section className="post-detail">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        </section>
      </>
    );
  }

  const shareUrl = window.location.href;
  const shareText = encodeURIComponent(`Confira este post: ${post.title}`);

  const formattedDate = new Date(post.date.seconds * 1000).toLocaleDateString(
    "pt-BR",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

  return (
    <>
      {post.featuredImage && (
        <div className="featured-image-full">
          <img src={post.featuredImage} alt={post.title} />
        </div>
      )}

      <section className="post-detail">
        <h1>{post.title}</h1>
        <p className="description">{post.summary}</p>

        <div className="meta">
          <div className="author">
            {author.photoURL ? (
              <img src={author.photoURL} alt={author.displayName} className="author-photo" />
            ) : (
              <div className="author-photo-placeholder">U</div>
            )}

            <div className="author-info">
              <span className="author-name">
                Publicado por {post.authorName}
              </span>
              <span className="author-date">
                em {formattedDate}
              </span>
            </div>
          </div>
        </div>

        <div className="share-buttons">
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp /> WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shareUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebookF /> Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              shareUrl
            )}&text=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTwitter /> Twitter
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              shareUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaLinkedinIn /> LinkedIn
          </a>
        </div>

        <div
          className="content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        ></div>
      </section>
    </>
  );
}
