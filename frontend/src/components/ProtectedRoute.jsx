import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    (async () => {
      try {
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
        
        // Verificar si el rol del usuario está permitido
        if (allowedRoles && !allowedRoles.includes(data.user.puesto)) {
          // Redirigir según el rol
          switch(data.user.puesto) {
            case 'empleado':
              navigate('/index');
              break;
            case 'abogado':
              navigate('/correo');
              break;
            case 'admin':
              navigate('/dashboard');
              break;
            default:
              navigate('/');
          }
        }
      } catch (err) {
        console.error(err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, allowedRoles]);

  if (loading) return <div style={{padding: 20}}>Cargando...</div>;

  return children;
}