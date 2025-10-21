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
    abogados: 0,
    urgentes: 0,
    no_urgentes: 0
  });
  const [topEmpleados, setTopEmpleados] = useState([]);
  const [recentCorreos, setRecentCorreos] = useState([]);
  const [filteredCorreos, setFilteredCorreos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterUrgency, setFilterUrgency] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // NUEVO: Estado para modal de correo
  const [selectedCorreo, setSelectedCorreo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingCorreo, setLoadingCorreo] = useState(false);
  
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

  useEffect(() => {
    applyFilters();
  }, [recentCorreos, filterStatus, filterUrgency, searchTerm]);

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
        
        const urgentes = data.recentCorreos?.filter(c => c.estado === 'urgente').length || 0;
        const no_urgentes = data.recentCorreos?.filter(c => c.estado === 'normal').length || 0;
        
        setStats({
          ...data.stats,
          urgentes,
          no_urgentes
        });
        setTopEmpleados(data.topEmpleados);
        setRecentCorreos(data.recentCorreos);
      }
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recentCorreos];

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.remitente_nombre.toLowerCase().includes(term) ||
        c.nombre_archivo.toLowerCase().includes(term) ||
        c.asunto.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado de lectura
    if (filterStatus === 'leido') {
      filtered = filtered.filter(c => c.leido);
    } else if (filterStatus === 'no_leido') {
      filtered = filtered.filter(c => !c.leido);
    }

    // Filtrar por urgencia
    if (filterUrgency === 'urgente') {
      filtered = filtered.filter(c => c.estado === 'urgente');
    } else if (filterUrgency === 'normal') {
      filtered = filtered.filter(c => c.estado === 'normal');
    }

    setFilteredCorreos(filtered);
  };

  // NUEVA FUNCIÓN: Abrir correo en modal
  const handleCorreoClick = async (correoId) => {
    setLoadingCorreo(true);
    setShowModal(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/admin/correo/${correoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSelectedCorreo(data.correo);
      } else {
        alert('Error al cargar el correo');
        setShowModal(false);
      }
    } catch (err) {
      console.error('Error al obtener correo:', err);
      alert('Error al cargar el correo');
      setShowModal(false);
    } finally {
      setLoadingCorreo(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCorreo(null);
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

  const getUrgencyClass = (estado) => {
    return estado === 'urgente' ? 'urgency-high' : 'urgency-normal';
  };

  if (loading) return <div style={{padding: 20}}>Cargando estadísticas...</div>;

// Función mejorada para convertir Markdown a HTML
const renderMarkdown = (text) => {
  if (!text) return '';
  
  let html = text
    // Títulos
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Negritas: **texto** -> <strong>texto</strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
 // Procesar líneas
  const lines = html.split('\n');
  let inList = false;
  let result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Solo convertir a lista si tiene <strong> (negritas)
    if (line.startsWith('- ') && line.includes('<strong>')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${line.substring(2)}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (line) {
        result.push(`<p>${line}</p>`);
      }
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  return result.join('');
};

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
        {/* Columna Izquierda - Métricas y Gráficos */}
        <div className="dashboard-left">
          <div className="dashboard-card metrics-grid">
            <div className="metric-card total">
              <div className="metric-icon">📧</div>
              <div className="metric-info">
                <span className="metric-label">Total Correos</span>
                <span className="metric-value">{stats.total_correos}</span>
              </div>
            </div>

            <div className="metric-card warning">
              <div className="metric-icon">⚠️</div>
              <div className="metric-info">
                <span className="metric-label">No Leídos</span>
                <span className="metric-value">{stats.no_leidos}</span>
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-icon">✅</div>
              <div className="metric-info">
                <span className="metric-label">Leídos</span>
                <span className="metric-value">{stats.leidos}</span>
              </div>
            </div>

            <div className="metric-card info">
              <div className="metric-icon">📁</div>
              <div className="metric-info">
                <span className="metric-label">Total Archivos</span>
                <span className="metric-value">{stats.total_archivos}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card urgency-metrics">
            <h3 className="card-title">CORREOS POR PRIORIDAD</h3>
            <div className="urgency-grid">
              <div className="urgency-card urgent">
                <div className="urgency-icon">🚨</div>
                <div className="urgency-info">
                  <span className="urgency-label">Urgentes</span>
                  <span className="urgency-value">{stats.urgentes}</span>
                </div>
              </div>
              <div className="urgency-card normal">
                <div className="urgency-icon">📬</div>
                <div className="urgency-info">
                  <span className="urgency-label">Normales</span>
                  <span className="urgency-value">{stats.no_urgentes}</span>
                </div>
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
        </div>

        {/* Columna Central - Usuarios y Actividad */}
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
                <div className="activity-icon">📊</div>
                <div className="activity-details">
                  <span className="activity-title">Correos Totales</span>
                  <span className="activity-number">{stats.total_correos}</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon pending">⏳</div>
                <div className="activity-details">
                  <span className="activity-title">Pendientes de Leer</span>
                  <span className="activity-number pending-number">{stats.no_leidos}</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon success">✔️</div>
                <div className="activity-details">
                  <span className="activity-title">Procesados</span>
                  <span className="activity-number success-number">{stats.leidos}</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon">📈</div>
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

        {/* Columna Derecha - Correos con Buscador y Filtros */}
        <div className="dashboard-right">
          <div className="dashboard-card tickets-table">
            <h3 className="card-title">CORREOS RECIENTES</h3>
            
            {/* NUEVO: Buscador */}
            <div className="search-container">
              <input
                type="text"
                placeholder="🔍 Buscar por remitente o archivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="clear-search"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="filters-container">
              <div className="filter-group">
                <label>Estado:</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="todos">Todos</option>
                  <option value="leido">Leídos</option>
                  <option value="no_leido">No Leídos</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Prioridad:</label>
                <select 
                  value={filterUrgency} 
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  className="filter-select"
                >
                  <option value="todos">Todos</option>
                  <option value="urgente">Urgentes</option>
                  <option value="normal">Normales</option>
                </select>
              </div>
            </div>

            <div className="results-count">
              Mostrando {filteredCorreos.length} de {recentCorreos.length} correos
            </div>

            <div className="table-header">
              <span>PRIORIDAD</span>
              <span>ESTADO</span>
              <span>REMITENTE</span>
              <span>FECHA</span>
            </div>
            
            <div className="tickets-list">
              {filteredCorreos.map((correo, index) => (
                <div 
                  key={index} 
                  className="ticket-row clickable"
                  onClick={() => handleCorreoClick(correo.id)}
                  title="Click para ver detalles"
                >
                  <span className={`ticket-urgency ${getUrgencyClass(correo.estado)}`}>
                    {correo.estado === 'urgente' ? '🚨' : '📬'}
                  </span>
                  <span className={`ticket-status ${getStatusClass(correo.leido)}`}>
                    {correo.leido ? 'Leído' : 'No leído'}
                  </span>
                  <span className="ticket-sender">{correo.remitente_nombre}</span>
                  <span className="ticket-date">{formatDate(correo.fecha_envio)}</span>
                </div>
              ))}
              {filteredCorreos.length === 0 && (
                <div className="no-data">
                  {searchTerm 
                    ? `No se encontraron correos con "${searchTerm}"` 
                    : 'No hay correos que coincidan con los filtros'}
                </div>
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
              {topEmpleados.slice(0, 8).map((empleado, index) => (
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
      </div>

      {/* NUEVO: Modal de Correo */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {loadingCorreo ? (
              <div className="modal-loading">Cargando correo...</div>
            ) : selectedCorreo ? (
              <>
                <div className="modal-header">
                  <h2>{selectedCorreo.asunto}</h2>
                  <button className="modal-close" onClick={closeModal}>✕</button>
                </div>

                <div className="modal-body">
                  <div className="correo-info">
                    <p><strong>De:</strong> {selectedCorreo.remitente_nombre}</p>
                    <p><strong>Para:</strong> {selectedCorreo.destinatario}</p>
                    <p><strong>Fecha:</strong> {formatDate(selectedCorreo.fecha_envio)}</p>
                    <p><strong>Archivo:</strong> {selectedCorreo.nombre_archivo}</p>
                    <p>
                      <strong>Prioridad:</strong> 
                      <span className={`priority-badge ${selectedCorreo.estado}`}>
                        {selectedCorreo.estado === 'urgente' ? '🚨 URGENTE' : '📬 Normal'}
                      </span>
                    </p>
                  </div>

{selectedCorreo.analisis_ia && (
  <div className="analisis-section">
    <h3>Análisis de IA</h3>
    <div 
      className="analisis-content markdown-content"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedCorreo.analisis_ia) }}
    />
  </div>
)}

                  {selectedCorreo.archivo_id && selectedCorreo.archivo_tipo?.includes('pdf') && (
                    <div className="pdf-viewer-section">
                      <h3>Vista Previa del Documento</h3>
                      <iframe
                        src={`http://localhost:4000/api/archivos/view/${selectedCorreo.archivo_id}?token=${localStorage.getItem('token')}`}
                        className="pdf-iframe"
                        title="Vista previa PDF"
                      />
                    </div>
                  )}

      <div className="modal-actions">
        {selectedCorreo.archivo_id && (
          <a
            href="#"
            className="btn-download"
            onClick={async (e) => {
              e.preventDefault();
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(
                  `http://localhost:4000/api/archivos/download/${selectedCorreo.archivo_id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) throw new Error('Error en la descarga');
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = selectedCorreo.nombre_archivo || 'archivo';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                console.error(err);
                alert('Error al descargar el archivo');
              }
            }}
          >
            📥 Descargar Archivo
          </a>
        )}
        <button onClick={closeModal} className="btn-close-modal">
          Cerrar
        </button>
      </div>
                </div>
              </>
            ) : (
              <div className="modal-error">Error al cargar el correo</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}