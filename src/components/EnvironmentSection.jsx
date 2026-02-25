import React, { useState } from 'react';
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import fotoConsultorio1 from "../assets/consultorio-dra-lueine1.webp"; 
import fotoConsultorio2 from "../assets/consultorio-dra-lueine2.webp";
import WhatsAppButton from "../components/WhatsAppButton";

export default function EnvironmentSection() {

  const images = [fotoConsultorio1, fotoConsultorio2];
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevImage = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const nextImage = () => {
    setCurrentIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section className="env-section">
      <div className="env-grid">

        <div className="env-text-top">
          <header className="section-header">
            <span className='label'>NOSSO AMBIENTE</span>
            <h2>Cuidado começa pelo ambiente</h2>
          </header>

          <p>
            Um consultório moderno, climatizado e acolhedor, pensado para garantir
            <strong> conforto, privacidade e tranquilidade.</strong>
          </p>
          <p>
            Aqui, cada atendimento acontece de forma individualizada, em um espaço reservado, preparado para consultas clínicas e um acompanhamento médico atento aos detalhes.
          </p>

          <WhatsAppButton className="about-button" />
        </div>

        {/* IMAGEM COM SETAS */}
        <div className="env-image-main">
          {images.map((image, index) => (
            <img
              key={image}
              src={image}
              alt="Ambiente do consultorio"
              className={`env-slide ${index === currentIndex ? "is-active" : ""}`}
              aria-hidden={index !== currentIndex}
            />
          ))}

          <button type="button" className="arrow left" onClick={prevImage}>
            <IoChevronBack />
          </button>

          <button type="button" className="arrow right" onClick={nextImage}>
            <IoChevronForward />
          </button>
        </div>

      </div>
    </section>
  );
}

