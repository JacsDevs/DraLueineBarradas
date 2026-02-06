import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleLogin() {
    if (loading) return;

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin");
    } catch (err) {
      alert("Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <span className="label">ÁREA ADMINISTRATIVA</span>
        <h3>Acesso Restrito</h3>

        <div className="admin-field">
          <input
            type="email"
            placeholder="Email"
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="admin-field password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            onChange={e => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        <button
          className="btn admin-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? <span className="loader"></span> : "Entrar"}
        </button>
      </div>
    </div>
  );
}