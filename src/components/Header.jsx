import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/header.css";
import logo from "../assets/logo.svg";

export default function Header() {
  const [open, setOpen] = useState(false);

  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (!element) return;

    const headerOffset = 90; // altura do header
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });

    setOpen(false); // fecha menu mobile
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
          <button onClick={() => handleScrollTo("contato")}>Contato</button>
        </div>
      </nav>
    </header>
  );
}