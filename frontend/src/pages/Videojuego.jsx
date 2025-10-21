import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Videojuego.css";

export default function Videojuego() {
  const [user, setUser] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGameLoaded, setGameLoaded] = useState(false);
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

  const toggleFullscreen = () => {
    const gameContainer = document.getElementById('game-iframe-container');
    
    if (!document.fullscreenElement) {
      gameContainer.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error al entrar en pantalla completa:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  return (
    <>
      <main className="videojuego-main">
        <h1 className="videojuego-title">Videojuego de Capacitación</h1>

        <div className="game-wrapper">
          <div 
            id="game-iframe-container" 
            className={`game-container ${isGameLoaded ? 'loaded' : ''}`}
            style={{ backgroundColor: isGameLoaded ? 'transparent' : '#222' }}
          >
            <iframe
              src="/unitygame/index.html"
              title="Juego Unity"
              className="game-iframe"
              allowFullScreen
              onLoad={() => setGameLoaded(true)}
              style={{ visibility: isGameLoaded ? 'visible' : 'hidden' }}
            ></iframe>
          </div>

          <div className="game-status">
            <h2 className="status-title">
              Estado: <span className="status-incomplete">incompleto</span>
            </h2>
          </div>
        </div>
      </main>
    </>
  );
}