import { useState } from "react";
import WhatsAppButton from "./WhatsAppButton";
import { LuChevronDown } from "react-icons/lu";

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "Quais são os métodos de pagamento aceitos?",
      answer:
        "Aceitamos Pix, cartão de crédito, cartão de débito e dinheiro, para sua maior comodidade."
    },
    {
      question: "Quando tempo dura a consulta?",
      answer:
        "A consulta tem duração aproximada de 60 minutos, pois envolve uma avaliação clínica detalhada, incluindo histórico médico, fatores de risco cardiovasculares, hábitos de vida e definição de um plano de cuidado individualizado."
    },
    {
      question: "Há contato telefônico após a consulta?",
      answer:
        "O contato é realizado exclusivamente para orientações administrativas e esclarecimento de dúvidas pontuais, quando necessário. Demandas clínicas são avaliadas em consulta, garantindo segurança e qualidade do cuidado."
    },
  ];

  function toggle(index) {
    setActiveIndex(activeIndex === index ? null : index);
  }

  return (
    <section id="faq" className="faq">
      <div className="faq-container">
        {/* LADO ESQUERDO */}
        <div className="faq-info">

          <header className="section-header">
            <span className="label">FAQ</span>
            <h2>Perguntas frequentes</h2>
          </header>

          <p>
            Não encontrou a resposta que procurava?
            <br />
            Entre em contato pelo WhatsApp para um atendimento personalizado.
          </p>

          <WhatsAppButton
            className="faq-button"
            text="Enviar mensagem"
            message = "Olá Dra. Lueine, estou com dúvidas."
          />
        </div>

        {/* LADO DIREITO */}
        <div className="faq-list">
          {faqs.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${activeIndex === index ? "active" : ""}`}
              onClick={() => toggle(index)}
            >
              <div className="faq-question">
                <span>{item.question}</span>
                <div className="arrow">
                  <LuChevronDown />
                </div>
              </div>

              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
