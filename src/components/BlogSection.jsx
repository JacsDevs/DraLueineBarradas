import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import "../styles/BlogSection.css"
import imagem from "../assets/imagem1.jpg"

export default function BlogSection() {
  const posts = [
    {
      id: 1,
      title: "Melhora a harmonia facial",
      excerpt:
        "A rinoplastia pode equilibrar proporções, suavizar traços e valorizar a beleza natural do rosto.",
      image: imagem,
      slug: "melhora-harmonia-facial",
    },
    {
      id: 2,
      title: "Corrige desvios e melhora a respiração",
      excerpt:
        "Além da estética, a cirurgia pode corrigir o desvio de septo.",
      image: imagem,
      slug: "respiracao-e-desvio-de-septo",
    },
    {
      id: 3,
      title: "Eleva a autoestima e a confiança",
      excerpt:
        "Sentir-se bem com a própria imagem reflete na autoestima.",
      image: imagem,
      slug: "autoestima-e-confianca",
    },
    {
      id: 4,
      title: "Eleva a autoestima e a confiança",
      excerpt:
        "Sentir-se bem com a própria imagem reflete na autoestima.",
      image: imagem,
      slug: "autoestima-e-confianca",
    },
  ]

  const [itemsPerPage, setItemsPerPage] = useState(3)
  const [page, setPage] = useState(0)

  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 1 : 3)
      setPage(0)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const totalPages = Math.ceil(posts.length / itemsPerPage)

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current

    if (Math.abs(distance) > 50) {
      if (distance > 0 && page < totalPages - 1) {
        setPage(page + 1)
      } else if (distance < 0 && page > 0) {
        setPage(page - 1)
      }
    }
  }

  return (
    <section className="blog-section">
      <h2 className="blog-title">Para leitura</h2>

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
                .slice(
                  index * itemsPerPage,
                  index * itemsPerPage + itemsPerPage
                )
                .map((post) => (
                  <article className="blog-card" key={post.id}>
                    <img
                      src={post.image}
                      alt={post.title}
                      className="blog-image"
                    />

                    <div className="blog-content">
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>

                      <Link
                        to={`/blog/${post.slug}`}
                        className="blog-link"
                      >
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
  )
}
