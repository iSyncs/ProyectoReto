import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/App.css";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function Correo() {
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
      <NavBar />
      <main className="index-main">
        <h1 className="index-title">
          Bienvenido abogado, {user.nombre} {user.apellido_p}
        </h1>
        <p className="index-puesto">
          Puesto: <span className="index-puesto-rol">{user.puesto}</span>
        </p>
        <h2 className="index-h2">
          Aquí podrás revisar tus <span className="index-jugando">correos legales</span>
        </h2>
        <p className="index-descripcion">
          Administra y revisa la correspondencia relacionada con procesos legales de manera organizada y segura.
        </p>
      </main>
      <Footer />
    </>
  );
}
