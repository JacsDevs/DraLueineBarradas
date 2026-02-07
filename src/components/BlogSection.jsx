import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import "../styles/blogsection.css";

export default function BlogSection() {
  const [posts, setPosts] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [page, setPage] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  /* ========== BUSCAR POSTS ========== */
  useEffect(() => {
    async function fetchPosts() {
      try {
        const q = query(collection(db, "posts"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(list);
      } finally {
        if (typeof document !== "undefined") {
          document.dispatchEvent(new Event("prerender-ready"));
        }
      }
    }
    fetchPosts();
  }, []);

  /* ========== RESPONSIVO ========== */
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 1 : 3);
      setPage(0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(posts.length / itemsPerPage);

  /* ========== SWIPE MOBILE ========== */
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
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

      <div
        className="carousel-wrapper"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {Array.from({ length: totalPages }).map((_, index) => (
            <div className="carousel-page" key={index}>
              {posts
                .slice(index * itemsPerPage, index * itemsPerPage + itemsPerPage)
                .map(post => (
                  <article className="blog-card" key={post.id}>
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="blog-image"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="blog-content">
                      <h3>{post.title}</h3>
                      <p>{post.summary}</p>
                      <Link to={`/post/${post.id}`} className="blog-link">
                        Ler mais →
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* INDICADOR EM LINHAS */}
      <div className="carousel-indicator">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`indicator-line ${i === page ? "active" : ""}`}
            onClick={() => setPage(i)}
            aria-label={`Página ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
