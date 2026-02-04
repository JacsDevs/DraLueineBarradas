import { useEffect, useRef, useState } from "react"
import { FaRegStar } from "react-icons/fa";
import "../styles/testimonials.css"

export default function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      name: "Paciente XXX",
      text:
        "Atendimento extremamente atencioso e humanizado. Me senti acolhida desde o início da consulta.",
    },
    {
      id: 2,
      name: "Paciente XXX",
      text:
        "Profissional excelente, muito cuidadosa e detalhista. A consulta foi completa e me trouxe muita segurança.",
    },
    {
      id: 3,
      name: "Paciente XXX",
      text:
        "Atendimento diferenciado, com foco na prevenção e no cuidado individual. Recomendo com total confiança.",
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

  const totalPages = Math.ceil(testimonials.length / itemsPerPage)

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
    <section id="depoimentos" className="testimonials">

      <header className="section-header">
        <span className="testimonials-label">DEPOIMENTOS</span>
        <h2>O que nossos pacientes dizem sobre nosso trabalho?</h2>
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
              {testimonials
                .slice(
                  index * itemsPerPage,
                  index * itemsPerPage + itemsPerPage
                )
                .map((item) => (
                  <div className="testimonial-card" key={item.id}>
                    <div className="testimonial-header">
                      <div className="avatar"></div>
                      <div>
                        <strong>{item.name}</strong>
                        <div className="stars">★★★★★</div>
                      </div>
                    </div>
                    <p>{item.text}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* INDICADOR */}
      <div className="carousel-indicator">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`indicator-line ${i === page ? "active" : ""}`}
            onClick={() => setPage(i)}
          />
        ))}
      </div>

      <a href="https://maps.app.goo.gl/e5MtxNupxjszhWMD6" className="testimonial-button">
        Escrever Avaliação
        <FaRegStar size={20} />
      </a>
    </section>
  )
}
