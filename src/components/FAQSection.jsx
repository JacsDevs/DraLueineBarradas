import { useState } from "react";

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "Quais são os métodos de pagamento aceitos?",
      answer:
        "Resposta"
    },
    {
      question: "Quando tempo dura a consulta?",
      answer:
        "Resposta"
    },
    {
      question: "Tenho direito a ter consulta após a consulta médica?",
      answer:
        "Resposta"
    },
    {
      question: "A Dra. Lueine fornece contato de telefone para dúvidas? ",
      answer:
        "Resposta"
    },
  ];

  function toggle(index) {
    setActiveIndex(activeIndex === index ? null : index);
  }

  return (
    <section className="faq">
      <div className="faq-container">
        {/* LADO ESQUERDO */}
        <div className="faq-info">
          <h2>Perguntas frequentes</h2>
          <p>
            Não encontrou a resposta que procurava?
            <br />
            Entre em contato pelo WhatsApp para um atendimento personalizado.
          </p>

          <a
            href="#"
            className="faq-button"
          >
            <span>💬</span> Enviar mensagem
          </a>
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
                <span className="arrow">⌄</span>
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
