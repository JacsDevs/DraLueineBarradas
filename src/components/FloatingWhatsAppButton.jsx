import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

const AUTO_HIDE_DELAY_MS = 2400;

export default function FloatingWhatsAppButton({
  label = "Agende sua consulta",
  phone = "5591985807373",
  message = "Olá Dra. Lueine, gostaria de agendar uma consulta.",
  resetKey = ""
}) {
  const [isHintVisible, setIsHintVisible] = useState(true);

  useEffect(() => {
    setIsHintVisible(true);

    const timerId = window.setTimeout(() => {
      setIsHintVisible(false);
    }, AUTO_HIDE_DELAY_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [resetKey]);

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <div
      className="floating-whatsapp"
      data-visible={isHintVisible ? "true" : "false"}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-whatsapp-link"
        aria-label="Agendar consulta pelo WhatsApp"
      >
        <span className="floating-whatsapp-bubble">
          {label}
        </span>
        <span className="floating-whatsapp-icon" aria-hidden="true">
          <FaWhatsapp aria-hidden="true" />
        </span>
      </a>
    </div>
  );
}
