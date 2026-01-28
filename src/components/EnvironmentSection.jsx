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
              Cuidado começa pelo ambiente
            </h2>
          </header>
          
          <p>
            Um consultório moderno, climatizado e acolhedor, pensado para garantir <strong>conforto, privacidade e tranquilidade.</strong>
          </p>
          <p>
            Aqui, cada atendimento acontece de forma individualizada, em um espaço reservado, preparado para consultas clínicas e um acompanhamento médico atento aos detalhes.
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