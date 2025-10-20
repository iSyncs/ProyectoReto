import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";

import banner from "../assets/img-banner-actualizar-version.webp";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Maneja el envío del formulario de login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Realiza la solicitud al backend
    try {
      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email, password }),
      });

      const data = await res.json();
      setLoading(false);
      // Maneja la respuesta del servidor
      if (res.ok) {
        localStorage.setItem("token", data.token);
        navigate("/index");
      } else // Si hay un error, muestra el mensaje
      {
        setError(data.message || "Error en login");
      }
    }
    // En caso de error de red u otro tipo 
    catch (err) {
      setLoading(false);
      setError("Error de conexión con el servidor");
    }
  };

    return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-left">
          <div className="image-placeholder">
            <img src={banner} alt="Banner" />
          </div>
        </div>

        <div className="login-right">
          <div className="tab-container">
            <button className="tab active">Log in</button>
          </div>

          <h2 className="title">Bienvenido</h2>

          <form id="loginForm" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email address"
              className="full-width"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="full-width"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Cargando..." : "Log in"}
            </button>
          </form>

          {error && <p id="error">{error}</p>}

          <Link to="/recover" className="recover-link">Forgot your password?</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;