import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/header.css";
import logo from "../assets/logo.svg";

export default function Header() {
  const [open, setOpen] = useState(false);

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
          <Link to="/" onClick={() => setOpen(false)}>Início</Link>
          <Link to="/admin" onClick={() => setOpen(false)}>Admin</Link>
        </div>
      </nav>
    </header>
  );
}