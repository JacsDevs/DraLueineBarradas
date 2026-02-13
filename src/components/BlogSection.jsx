import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { buildPostSlugId } from "../utils/slugify";
import { isPublishedPost } from "../utils/postStatus";
import "../styles/blogsection.css";

const buildSrcSet = (src) => (src ? `${src} 1x, ${src} 2x` : undefined);

export default function BlogSection() {
  const [posts, setPosts] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [page, setPage] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    async function fetchPosts() {
      const q = query(collection(db, "posts"), orderBy("date", "desc"), limit(24));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setPosts(list.filter((post) => isPublishedPost(post)).slice(0, 6));
    }

    fetchPosts();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 1 : 3);
      setPage(0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const hasPosts = posts.length > 0;
  const totalPages = hasPosts ? Math.ceil(posts.length / itemsPerPage) : 0;

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchMove = (event) => {
    touchEndX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;

    if (Math.abs(distance) > 50) {
      if (distance > 0 && page < totalPages - 1) {
        setPage(page + 1);
      } else if (distance < 0 && page > 0) {
        setPage(page - 1);
      }
    }
  };

  return (
    <section id="blog" className="blog-section">
      <header className="label-container">
        <span className="label">ARTIGOS</span>
        <h2 className="blog-title">Para leitura</h2>
      </header>

      {hasPosts ? (
        <div
          className="carousel-wrapper"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="carousel-track" style={{ transform: `translateX(-${page * 100}%)` }}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <div className="carousel-page" key={index}>
                {posts
                  .slice(index * itemsPerPage, index * itemsPerPage + itemsPerPage)
                  .map((post) => {
                    const postUrl = `/post/${buildPostSlugId({
                      title: post.title,
                      id: post.id,
                      slug: post.slug
                    })}`;

                    return (
                      <article className="blog-card" key={post.id}>
                        {post.featuredImage && (
                          <img
                            src={post.featuredImage}
                            srcSet={buildSrcSet(post.featuredImage)}
                            sizes="(max-width: 768px) 90vw, 30vw"
                            alt={post.title}
                            className="blog-image"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div className="blog-content">
                          <h3>
                            <Link to={postUrl} className="blog-title-link">
                              {post.title}
                            </Link>
                          </h3>
                          <p>{post.summary}</p>
                          <Link to={postUrl} className="blog-link">
                            Ler mais
                          </Link>
                        </div>
                      </article>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="blog-empty">Nenhum post publicado ainda.</p>
      )}

      {totalPages > 1 && (
        <div className="carousel-indicator">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`indicator-line ${index === page ? "active" : ""}`}
              onClick={() => setPage(index)}
              aria-label={`Pagina ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
