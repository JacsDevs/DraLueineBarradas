import { Link } from "react-router-dom";
import logo from "../assets/logo-principal.svg"
import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Coluna 1 - Logo e descrição */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src={logo} alt="Dra. Lueine Barradas" />
          </Link>
        </div>

        <div className="footer-right">
          <div className="footer-links">
            <h4>Navegação</h4>
            <ul>
              <li><Link to="/">Início</Link></li>
              <li><Link to="/servicos">Serviços</Link></li>
              <li><Link to="/depoimentos">Depoimentos</Link></li>
              <li><Link to="/contato">Agendar consulta</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contatos</h4>
            <p>(91) 98580-7373</p>
            <p>@dralueinebarradas</p>
            <span className="footer-location">Bragança - PA</span>
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
