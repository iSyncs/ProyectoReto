import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/NavBar.css";
import logoImg from "../assets/logosantandercentro.png";

export default function NavBar() {
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:4000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.user.puesto);
        }
      } catch (err) {
        console.error("Error al obtener rol:", err);
      }
    };

    fetchUserRole();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Configuración de enlaces según el rol
  const navLinks = {
    empleado: [
      { to: "/index", label: "Escanear" },
      { to: "/manual", label: "Manual de uso" },
      { to: "/videojuego", label: "Videojuego" }
    ],
    abogado: [
      { to: "/correo", label: "Correo" },
      { to: "/manual", label: "Manual de uso" },
      { to: "/videojuego", label: "Videojuego" }
    ],
    admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/gestion-usuarios", label: "Gestión Usuarios" },
    { to: "/manual", label: "Manual de uso" },
    { to: "/videojuego", label: "Videojuego" }
    ]
  };

  const linksToShow = navLinks[userRole] || [];

  return (
    <nav className="navbar">
      <div className="logo-center">
        <img src={logoImg} alt="Logo" className="logo-img" />
      </div>
      
      {linksToShow.map((link) => (
        <NavLink 
          key={link.to}
          to={link.to} 
          className={({ isActive }) => isActive ? "active-link" : ""}
        >
          {link.label}
        </NavLink>
      ))}
      
      <button className="logout-btn" onClick={handleLogout}>
        Cerrar Sesión
      </button>
    </nav>
  );
}