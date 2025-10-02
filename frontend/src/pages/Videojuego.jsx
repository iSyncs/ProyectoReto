import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/App.css";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import imgjuego from "../assets/game.png";

export default function Videojuego() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/"); 
      return;
    }

    (async () => {
      const res = await fetch("http://localhost:4000/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    })();
  }, [navigate]);

  if (!user) return <div style={{padding:20}}>Cargando...</div>;

  return (
    <>
      <main className="index-main">
        <h1 className="videojuego-title">Videojuego de Capacitación</h1>
        <p className="videojuego-descripcion">
          "Aquí se cargará el módulo interactivo de capacitación. Haz clic en el botón para entrar en pantalla completa.""
        </p>
        <div className="game-container">
          <div className="game-placeholder"><img src={imgjuego} alt="" /></div>
                  <center>
                  <h1 className="videojuego-title">Estado:<span className="manual-title-red"> incompleto </span> </h1>
</center>
        </div>
      </main>
    </>
  );
}
