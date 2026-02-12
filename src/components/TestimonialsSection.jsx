import { useEffect, useRef, useState } from "react"
import { FaRegStar } from "react-icons/fa";
import "../styles/testimonials.css"

export default function TestimonialsSection() {
  const fallbackTestimonials = [
    {
      id: 1,
      name: "Paciente XXX",
      text:
        "Atendimento extremamente atencioso e humanizado. Me senti acolhida desde o inÃ­cio da consulta.",
      rating: 5,
    },
    {
      id: 2,
      name: "Paciente XXX",
      text:
        "Profissional excelente, muito cuidadosa e detalhista. A consulta foi completa e me trouxe muita seguranÃ§a.",
      rating: 5,
    },
    {
      id: 3,
      name: "Paciente XXX",
      text:
        "Atendimento diferenciado, com foco na prevenÃ§Ã£o e no cuidado individual. Recomendo com total confianÃ§a.",
      rating: 5,
    },
  ]

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  const placeId = import.meta.env.VITE_PLACE_ID
  const hasGooglePlacesConfig = Boolean(apiKey && placeId)

  const [testimonials, setTestimonials] = useState(fallbackTestimonials)
  const [placeUrl, setPlaceUrl] = useState("https://maps.app.goo.gl/e5MtxNupxjszhWMD6")
  const [loading, setLoading] = useState(hasGooglePlacesConfig)

  const [itemsPerPage, setItemsPerPage] = useState(3)
  const [page, setPage] = useState(0)

  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    if (!hasGooglePlacesConfig) return

    const loadGoogleMapsScript = () =>
      new Promise((resolve, reject) => {
        if (window.google?.maps?.places) {
          resolve()
          return
        }

        const existing = document.getElementById("google-maps-js")
        if (existing) {
          existing.addEventListener("load", resolve)
          existing.addEventListener("error", reject)
          return
        }

        const script = document.createElement("script")
        script.id = "google-maps-js"
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })

    const loadReviews = async () => {
      try {
        await loadGoogleMapsScript()
        if (!window.google?.maps?.places) {
          setLoading(false)
          return
        }

        const service = new window.google.maps.places.PlacesService(
          document.createElement("div")
        )

        service.getDetails(
          {
            placeId,
            fields: ["reviews", "url"],
          },
          (place, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              place?.reviews?.length
            ) {
              const mapped = place.reviews
                .filter((review) => review?.text)
                .map((review, index) => ({
                  id: review.time || index,
                  name: review.author_name || "Paciente",
                  text: review.text,
                  rating: review.rating || 5,
                  avatar: review.profile_photo_url || "",
                }))

              if (mapped.length > 0) {
                setTestimonials(mapped)
              }
            }

            if (place?.url) {
              setPlaceUrl(place.url)
            }

            setLoading(false)
          }
        )
      } catch {
        setLoading(false)
      }
    }

    loadReviews()
  }, [apiKey, hasGooglePlacesConfig, placeId])

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
                      <div
                        className="avatar"
                        style={
                          item.avatar
                            ? { backgroundImage: `url(${item.avatar})` }
                            : undefined
                        }
                      ></div>
                      <div>
                        <strong>{item.name}</strong>
                        <div className="stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < item.rating ? "★" : "☆"}</span>
                          ))}
                        </div>
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

      <a href={placeUrl} className="testimonial-button">
        {loading ? "Carregando avaliações..." : "Escrever Avaliação"}
        <FaRegStar size={20} />
      </a>
    </section>
  )
}
