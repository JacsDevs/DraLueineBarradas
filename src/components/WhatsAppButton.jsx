import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppButton({
  text = "Agende sua consulta",
  className = "",
  phone = "5591985807373",
  message = "Olá Dra. Lueine, gostaria de agendar uma consulta."
}) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {text}
      <FaWhatsapp size={20} />
    </a>
  );
}
