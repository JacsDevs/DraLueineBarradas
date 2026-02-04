import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo-principal-lueine.svg";
import "../styles/footer.css";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  const navigate = useNavigate();

  const handleScrollTo = (id) => {
    if (window.location.pathname !== "/") {
      navigate("/");
      // espera a navegação e depois rola
      setTimeout(() => {
        const element = document.getElementById(id);
        if (!element) return;

        const headerOffset = 90;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (!element) return;

      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Logo */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src={logo} alt="Dra. Lueine Barradas" />
          </Link>
        </div>

        <div className="footer-right">
          {/* Navegação */}
          <div className="footer-links">
            <h4>Navegação</h4>
            <ul>
              <li><button onClick={() => handleScrollTo("inicio")}>Início</button></li>
              <li><button onClick={() => handleScrollTo("servicos")}>Serviços</button></li>
              <li><button onClick={() => handleScrollTo("depoimentos")}>Depoimentos</button></li>
              <li><button onClick={() => handleScrollTo("contato")}>Agendar consulta</button></li>
            </ul>
          </div>

          {/* Contato */}
          <div className="footer-contact">
            <h4>Contatos</h4>
            <p>
              <a
                href="https://wa.me/5591985807373"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-icons"
              >
                <FaWhatsapp className="footer-icon" />
                (91) 98580-7373
              </a>
            </p>
            <p>
              <a
                href="https://www.instagram.com/dralueinebarradas"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-icons"
              >
                <FaInstagram className="footer-icon" />
                @dralueinebarradas
              </a>
            </p>
            <span className="footer-location">Av. Nazeazeno Ferreira,<br/>60 - Padre Luiz,<br/>Bragança - PA</span>
          </div>
        </div>
      </div>

      <div className="footer-divider" />

      <div className="footer-bottom">
        <p>© Dra. Lueine Barradas 2026. Todos os direitos reservados.</p>
        <p>Desenvolvido por: JacsDevs - jacsdevs@gmail.com</p>
      </div>
    </footer>
  );
}
