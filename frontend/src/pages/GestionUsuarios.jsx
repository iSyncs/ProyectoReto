import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GestionUsuarios.css";

export default function GestionUsuarios() {
  const [user, setUser] = useState(null);
  const [newUser, setNewUser] = useState({
    nombre: '',
    apellido_p: '',
    apellido_m: '',
    puesto: 'empleado'
  });
  const [createdUserData, setCreatedUserData] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
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
      
      if (data.user.puesto !== 'admin') {
        navigate("/dashboard");
        return;
      }
      
      setUser(data.user);
    })();
  }, [navigate]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:4000/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedUserData(data.usuario);
        setNewUser({ nombre: '', apellido_p: '', apellido_m: '', puesto: 'empleado' });
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      alert("Error al crear usuario");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleNewUser = () => {
    setCreatedUserData(null);
    setNewUser({ nombre: '', apellido_p: '', apellido_m: '', puesto: 'empleado' });
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  if (!user) return <div className="loading">Cargando...</div>;

  return (
    <div className="gestion-container">
      <div className="gestion-card">
        {!createdUserData ? (
          <>
            <div className="card-header">
              <h1>Crear Nuevo Usuario</h1>
              <p>Complete el formulario para registrar un nuevo usuario en el sistema</p>
            </div>

            <form onSubmit={handleCreateUser} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={newUser.nombre}
                    onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
                    required
                    placeholder="Ej: Juan"
                  />
                </div>

                <div className="form-group">
                  <label>Apellido Paterno *</label>
                  <input
                    type="text"
                    value={newUser.apellido_p}
                    onChange={(e) => setNewUser({...newUser, apellido_p: e.target.value})}
                    required
                    placeholder="Ej: Pérez"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Apellido Materno</label>
                  <input
                    type="text"
                    value={newUser.apellido_m}
                    onChange={(e) => setNewUser({...newUser, apellido_m: e.target.value})}
                    placeholder="Ej: García (opcional)"
                  />
                </div>

                <div className="form-group">
                  <label>Puesto *</label>
                  <select
                    value={newUser.puesto}
                    onChange={(e) => setNewUser({...newUser, puesto: e.target.value})}
                    required
                  >
                    <option value="empleado">Empleado</option>
                    <option value="abogado">Abogado</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="info-box">
                <strong>ℹ️ Información:</strong> El sistema generará automáticamente el correo y contraseña para el nuevo usuario.
              </div>

              <button 
                type="submit" 
                className="btn-submit"
                disabled={creatingUser}
              >
                {creatingUser ? "Creando Usuario..." : "Crear Usuario"}
              </button>
            </form>
          </>
        ) : (
          <div className="success-view">
            <div className="success-icon">✓</div>
            <h1>Usuario Creado Exitosamente</h1>
            
            <div className="credentials-card">
              <h2>Credenciales Generadas</h2>
              
              <div className="credential-row">
                <span className="credential-label">Nombre Completo</span>
                <span className="credential-value">
                  {createdUserData.nombre} {createdUserData.apellido_p} {createdUserData.apellido_m}
                </span>
              </div>

              <div className="credential-row">
                <span className="credential-label">Puesto</span>
                <span className={`credential-badge ${createdUserData.puesto}`}>
                  {createdUserData.puesto}
                </span>
              </div>

              <div className="credential-row highlight">
                <span className="credential-label">Correo Electrónico</span>
                <span className="credential-value email">
                  {createdUserData.correo}
                </span>
              </div>

              <div className="credential-row highlight">
                <span className="credential-label">Contraseña Temporal</span>
                <span className="credential-value password">
                  {createdUserData.password}
                </span>
              </div>
            </div>

            <div className="warning-card">
              <strong>⚠️ IMPORTANTE</strong>
              <p>Guarde estas credenciales en un lugar seguro. Compártalas con el nuevo usuario de forma segura.</p>
              <p>Esta información no se volverá a mostrar por seguridad.</p>
            </div>

            <div className="action-buttons">
              <button className="btn-new" onClick={handleNewUser}>
                Crear Otro Usuario
              </button>
              <button className="btn-dashboard" onClick={handleBack}>
                Volver al Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}