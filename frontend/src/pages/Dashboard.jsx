import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    total_correos: 0,
    no_leidos: 0,
    leidos: 0,
    total_archivos: 0,
    total_usuarios: 0,
    empleados: 0,
    abogados: 0
  });
  const [topEmpleados, setTopEmpleados] = useState([]);
  const [recentCorreos, setRecentCorreos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchUserData(token);
    fetchDashboardData(token);
    
  }, [navigate]);

   const fetchUserData = async (token) => {
    try {
      const res = await fetch("http://localhost:4000/api/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Error al cargar usuario:", err);
    }
  };

  const fetchDashboardData = async (token) => {
    try {
      const res = await fetch("http://localhost:4000/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTopEmpleados(data.topEmpleados);
        setRecentCorreos(data.recentCorreos);
      }
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (leido) => {
    return leido ? 'status-leido' : 'status-no-leido';
  };

  if (loading) return <div style={{padding: 20}}>Cargando estadísticas...</div>;

  return (
    <main className="dashboard-main">
      <div className="dashboard-header">
        <h1 className="dashboard-title">DASHBOARD</h1>
              <p className="dashboard-user">
        {user?.nombre} {user?.apellido_p}
      </p>
      <p className="dashboard-role">
       <span className="dashboard-role-highlight">{user?.puesto}</span>
      </p>
      </div>

      <div className="dashboard-container">
        {/* Columna Izquierda - Métricas principales */}
        <div className="dashboard-left">
          <div className="dashboard-card metrics-grid">
            <div className="metric-card total">
              <div className="metric-icon"></div>
              <div className="metric-info">
                <span className="metric-label">Total Correos</span>
                <span className="metric-value">{stats.total_correos}</span>
              </div>
            </div>

            <div className="metric-card warning">
              <div className="metric-icon"></div>
              <div className="metric-info">
                <span className="metric-label">No Leídos</span>
                <span className="metric-value">{stats.no_leidos}</span>
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-icon"></div>
              <div className="metric-info">
                <span className="metric-label">Leídos</span>
                <span className="metric-value">{stats.leidos}</span>
              </div>
            </div>

            <div className="metric-card info">
              <div className="metric-icon"></div>
              <div className="metric-info">
                <span className="metric-label">Total Archivos</span>
                <span className="metric-value">{stats.total_archivos}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title">TOP EMPLEADOS POR DOCUMENTOS ENVIADOS</h3>
              <div className="chart-container">
                {topEmpleados.length > 0 ? (
                topEmpleados.slice(0, 10).map((empleado, index) => {
                const maxHeight = Math.max(...topEmpleados.map(e => e.total));
                const minHeight = Math.min(...topEmpleados.map(e => e.total));
                const range = maxHeight - minHeight || 1;
        
                // Calcular altura con mejor escala (mínimo 20%, máximo 100%)
                const height = minHeight === maxHeight 
                ? 100 
                : 20 + ((empleado.total - minHeight) / range) * 80;
        
          return (
              <div key={index} className="chart-column">
                <div 
                className="chart-bar" 
                style={{height: `${height}%`}}
                title={`${empleado.nombre} ${empleado.apellido}: ${empleado.total} documentos`}
              >
                <span className="bar-value">{empleado.total}</span>
              </div>
              <span className="chart-label">{empleado.nombre.split(' ')[0]}</span>
          </div>
        );
      })
    ) : (
      <div className="no-data">No hay datos de empleados</div>
    )}
  </div>
</div>

          <div className="dashboard-card">
            <h3 className="card-title">LISTA DE EMPLEADOS</h3>
            <div className="workers-list">
              <div className="list-header">
                <span>Empleado</span>
                <span>Documentos</span>
              </div>
              {topEmpleados.map((empleado, index) => (
                <div key={index} className="worker-item">
                  <span>{empleado.nombre} {empleado.apellido}</span>
                  <span className="worker-count">{empleado.total}</span>
                </div>
              ))}
              {topEmpleados.length === 0 && (
                <div className="no-data">No hay datos disponibles</div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Central - Estadísticas del sistema */}
        <div className="dashboard-center">
          <div className="dashboard-card">
            <h3 className="card-title">USUARIOS DEL SISTEMA</h3>
            <div className="stats-circle-container">
              <div className="circle-stat">
                <div className="circle-progress" style={{'--progress': `${(stats.total_usuarios / 100) * 360}deg`}}>
                  <span className="circle-number">{stats.total_usuarios}</span>
                </div>
                <span className="circle-label">Total Usuarios</span>
              </div>
            </div>
            
            <div className="users-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-label">Empleados</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill empleado-fill" 
                    style={{width: `${(stats.empleados/stats.total_usuarios)*100}%`}}
                  ></div>
                </div>
                <span className="breakdown-value">{stats.empleados}</span>
              </div>
              
              <div className="breakdown-item">
                <span className="breakdown-label">Abogados</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill abogado-fill" 
                    style={{width: `${(stats.abogados/stats.total_usuarios)*100}%`}}
                  ></div>
                </div>
                <span className="breakdown-value">{stats.abogados}</span>
              </div>

              <div className="breakdown-item">
                <span className="breakdown-label">Administradores</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill admin-fill" 
                    style={{width: `${((stats.total_usuarios - stats.empleados - stats.abogados)/stats.total_usuarios)*100}%`}}
                  ></div>
                </div>
                <span className="breakdown-value">{stats.total_usuarios - stats.empleados - stats.abogados}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title">RESUMEN DE ACTIVIDAD</h3>
            <div className="activity-summary">
              <div className="activity-item">
                <div className="activity-icon"></div>
                <div className="activity-details">
                  <span className="activity-title">Correos Totales</span>
                  <span className="activity-number">{stats.total_correos}</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon pending"></div>
                <div className="activity-details">
                  <span className="activity-title">Pendientes de Leer</span>
                  <span className="activity-number pending-number">{stats.no_leidos}</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon success"></div>
                <div className="activity-details">
                  <span className="activity-title">Procesados</span>
                  <span className="activity-number success-number">{stats.leidos}</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon"></div>
                <div className="activity-details">
                  <span className="activity-title">Tasa de Procesamiento</span>
                  <span className="activity-number">
                    {stats.total_correos > 0 ? Math.round((stats.leidos/stats.total_correos)*100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Correos recientes */}
        <div className="dashboard-right">
          <div className="dashboard-card tickets-table">
            <h3 className="card-title">CORREOS RECIENTES</h3>
            <div className="table-header">
              <span>ESTADO</span>
              <span>REMITENTE</span>
              <span>FECHA</span>
            </div>
            <div className="tickets-list">
              {recentCorreos.map((correo, index) => (
                <div key={index} className="ticket-row">
                  <span className={`ticket-status ${getStatusClass(correo.leido)}`}>
                    {correo.leido ? 'Leído' : 'No leído'}
                  </span>
                  <span className="ticket-sender">{correo.remitente_nombre}</span>
                  <span className="ticket-date">{formatDate(correo.fecha_envio)}</span>
                </div>
              ))}
              {recentCorreos.length === 0 && (
                <div className="no-data">No hay correos recientes</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}