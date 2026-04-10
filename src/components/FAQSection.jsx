import { useState } from "react";
import WhatsAppButton from "./WhatsAppButton";
import { LuChevronDown } from "react-icons/lu";

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "Quanto tempo dura a consulta?",
      answer:
        "A consulta tem duração aproximada de 60 minutos. Esse tempo é dedicado a uma avaliação cuidadosa e completa, incluindo seu histórico de saúde, fatores de risco, hábitos de vida e definição de um plano de cuidado individualizado, pensado especialmente para você."
    },
    {
      question: "Você atende crianças?",
      answer:
        "Meu atendimento é direcionado ao público adulto, com foco em prevenção e acompanhamento da saúde cardiovascular ao longo da vida."
    },
    {
      question: "Você atende por plano de saúde?",
      answer:
        "Atualmente, não atendo por planos de saúde. O modelo de atendimento é particular, permitindo uma consulta mais completa, com tempo adequado, escuta atenta e cuidado individualizado."
    },
    {
      question: "Você realiza consulta online?",
      answer:
        "Sim, realizo teleconsulta. Essa modalidade permite maior comodidade e continuidade no acompanhamento, especialmente para organização de exames, orientação de tratamento e seguimento clínico."
    },
    {
      question: "Como funciona o retorno?",
      answer:
        "Cada consulta é estruturada para ser completa e resolutiva. Por isso, não trabalhamos com consulta de retorno vinculada. Quando necessário, um novo atendimento pode ser agendado, garantindo sempre um cuidado individualizado e adequado a cada momento do paciente."
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
            >
              <button
                type="button"
                className="faq-question"
                onClick={() => toggle(index)}
                aria-expanded={activeIndex === index}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
              >
                <span>{item.question}</span>
                <span className="arrow" aria-hidden="true">
                  <LuChevronDown />
                </span>
              </button>

              <div
                className="faq-answer"
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                aria-hidden={activeIndex !== index}
              >
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
