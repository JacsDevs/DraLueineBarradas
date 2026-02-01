import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/header.css";
import logo from "../assets/logo-secundaria-branca.svg";

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleScrollTo = (id) => {
    if (window.location.pathname !== '/') {
      // Navega para a página inicial
      navigate('/');
    } else {
      // Rola para a seção, se já estiver na home
      const element = document.getElementById(id);
      if (!element) return;

      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    setOpen(false); // Fecha o menu mobile
  };

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/" className="logo">
          <img src={logo} alt="Dra. Lueine Barradas" />
        </Link>

        <button
          className={`hamburger ${open ? "active" : ""}`}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`menu ${open ? "open" : ""}`}>
          <button onClick={() => handleScrollTo("inicio")}>Início</button>
          <button onClick={() => handleScrollTo("servicos")}>Serviços</button>
          <button onClick={() => handleScrollTo("consulta")}>Consulta</button>
          <button onClick={() => handleScrollTo("sobre")}>Sobre</button>
          <button onClick={() => handleScrollTo("blog")}>Artigos</button>
          <button onClick={() => handleScrollTo("contato")}>Contato</button>
        </div>
      </nav>
    </header>
  );
}
