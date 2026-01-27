import React from 'react';
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import fotoConsultorio1 from "../assets/sala1.jpeg"; 
import fotoConsultorio2 from "../assets/sala2.jpeg";
import WhatsAppButton from "../components/WhatsAppButton";

export default function EnvironmentSection() {
  return (
    <section className="env-section">
      <div className="env-grid">
        
        {/* Bloco Superior Esquerdo: Títulos */}
        <div className="env-text-top">

          <header className="section-header">
            <span className='label'>NOSSO AMBIENTE</span>
            <h2>
              Um espaço pensado para cuidar de você em todos os detalhes
            </h2>
          </header>
          
          <p>
            Cada detalhe do nosso consultório foi planejado para que a sua 
            experiência <strong>seja segura, confortável e reservada.</strong>
          </p>
          <p>
            Ambiente moderno, climatizado e acolhedor, com estacionamento no local, 
            recepção ampla e salas de atendimento privativas e equipadas para 
            consultas e procedimentos.
          </p>
          <WhatsAppButton
            className="about-button"
          />
        </div>

        <div className="env-image-main">
          <img src={fotoConsultorio1} alt="Ambiente do consultório" />
        </div>
      </div>
    </section>
  );
}