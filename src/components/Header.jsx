import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "../styles/header.css";
import logo from "../assets/logo-secundaria-branca.svg";

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

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

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      const menuEl = menuRef.current;
      const buttonEl = buttonRef.current;
      if (!menuEl || !buttonEl) return;
      if (menuEl.contains(event.target) || buttonEl.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/" className="logo">
          <img src={logo} alt="Dra. Lueine Barradas" />
        </Link>

        <button
          className={`hamburger ${open ? "active" : ""}`}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
          ref={buttonRef}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="menu-mobile"
          className={`menu ${open ? "open" : ""}`}
          ref={menuRef}
        >
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
