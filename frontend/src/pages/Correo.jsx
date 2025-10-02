import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Correo.css";

export default function Correo() {
  const [user, setUser] = useState(null);
  const [correos, setCorreos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCorreo, setSelectedCorreo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    fetchUserAndEmails(token);
  }, [navigate]);

  const fetchUserAndEmails = async (token) => {
    try {
      const userRes = await fetch("http://localhost:4000/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) {
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      const correosRes = await fetch("http://localhost:4000/api/correos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (correosRes.ok) {
        const correosData = await correosRes.json();
        setCorreos(correosData.correos);
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = async (correo) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:4000/api/correos/${correo.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCorreo(data.correo);
        setShowModal(true);
        
        setCorreos(prev => 
          prev.map(c => c.id === correo.id ? { ...c, leido: true } : c)
        );
      }
    } catch (err) {
      console.error("Error al abrir correo:", err);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setShowPdfViewer(false);
    setSelectedCorreo(null);
  };

  const handleViewPdf = () => {
  setShowPdfViewer(true);
};

const handleDownload = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`http://localhost:4000/api/archivos/download/${selectedCorreo.archivo_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedCorreo.nombre_archivo;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('Error al descargar:', err);
    alert('Error al descargar el archivo');
  }
};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoy";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer";
    } else {
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupByDate = (correos) => {
    const today = [];
    const yesterday = [];
    const older = [];

    correos.forEach(correo => {
      const dateLabel = formatDate(correo.fecha_envio);
      if (dateLabel === "Hoy") {
        today.push(correo);
      } else if (dateLabel === "Ayer") {
        yesterday.push(correo);
      } else {
        older.push(correo);
      }
    });

    return { today, yesterday, older };
  };

  if (loading) return <div style={{padding: 20}}>Cargando...</div>;

  const { today, yesterday, older } = groupByDate(correos);
  const unreadCount = correos.filter(c => !c.leido).length;

  return (

  <main className="correo-main">
    <div className="page-header">
        <h1 className="page-title">
        Bienvenido, {user?.nombre} {user?.apellido_p}
      </h1>
      <p className="page-puesto">
      </p>
    </div>

    <div className="email-header">
      <div className="email-time">{new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
      <div className="email-greeting">Hola {user?.nombre}</div>
    </div>
      
      <div className="email-sidebar">
        <div className="email-folder active">
          <span>Recibidos</span>
          <span className="folder-count">{correos.length}</span>
        </div>
        <div className="email-folder">
          <span>No leidos</span>
          <span className="folder-count">{unreadCount}</span>
        </div>
      </div>

      <div className="correo-container">
        <div className="email-list">
          {correos.length === 0 && (
            <div className="no-emails">No hay correos</div>
          )}

          {today.length > 0 && (
            <>
              <div className="date-separator">Hoy</div>
              {today.map(correo => (
                <div 
                  key={correo.id} 
                  className={`email-item ${!correo.leido ? 'unread' : ''}`}
                  onClick={() => handleEmailClick(correo)}
                >
                  <div className="email-content">
                    <div className="email-sender">{correo.remitente_nombre}</div>
                    <div className="email-subject">{correo.asunto}</div>
                    <div className="email-preview">
                      {correo.nombre_archivo && `${correo.nombre_archivo}`}
                    </div>
                  </div>
                  <div className="email-indicator">
                    {!correo.leido && <div className="unread-dot"></div>}
                  </div>
                </div>
              ))}
            </>
          )}

          {yesterday.length > 0 && (
            <>
              <div className="date-separator">Ayer</div>
              {yesterday.map(correo => (
                <div 
                  key={correo.id} 
                  className={`email-item ${!correo.leido ? 'unread' : ''}`}
                  onClick={() => handleEmailClick(correo)}
                >
                  <div className="email-content">
                    <div className="email-sender">{correo.remitente_nombre}</div>
                    <div className="email-subject">{correo.asunto}</div>
                    <div className="email-preview">
                      {correo.nombre_archivo && `${correo.nombre_archivo}`}
                    </div>
                  </div>
                  <div className="email-indicator">
                    {!correo.leido && <div className="unread-dot"></div>}
                  </div>
                </div>
              ))}
            </>
          )}

          {older.length > 0 && (
            <>
              <div className="date-separator">Anteriores</div>
              {older.map(correo => (
                <div 
                  key={correo.id} 
                  className={`email-item ${!correo.leido ? 'unread' : ''}`}
                  onClick={() => handleEmailClick(correo)}
                >
                  <div className="email-content">
                    <div className="email-sender">{correo.remitente_nombre}</div>
                    <div className="email-subject">{correo.asunto}</div>
                    <div className="email-preview">
                      {correo.nombre_archivo && `${correo.nombre_archivo}`}
                    </div>
                  </div>
                  <div className="email-indicator">
                    {!correo.leido && <div className="unread-dot"></div>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {showModal && selectedCorreo && (
  <div className="modal-overlay" onClick={closeModal}>
    <div 
      className={`modal-content ${showPdfViewer ? 'pdf-mode' : ''}`} 
      onClick={e => e.stopPropagation()}
    >
      <button className="close-modal" onClick={closeModal}>&times;</button>
            
            {!showPdfViewer ? (
              <>
                <div className="modal-header">
                  <h2 className="modal-subject">{selectedCorreo.asunto}</h2>
                  <div className="modal-meta">
                    <div className="modal-from">
                      <strong>De:</strong> {selectedCorreo.remitente_nombre}
                    </div>
                    <div className="modal-date">
                      <strong>Fecha:</strong> {formatDateTime(selectedCorreo.fecha_envio)}
                    </div>
                  </div>
                </div>

                {selectedCorreo.nombre_archivo && (
                  <div className="modal-attachment">
                    <span className="attachment-icon">📎</span>
                    <span className="attachment-name">{selectedCorreo.nombre_archivo}</span>
                    <div className="attachment-actions">
                      <button className="view-btn" onClick={handleViewPdf}>
                        Ver PDF
                      </button>
                      <button className="download-btn" onClick={handleDownload}>
                        Descargar
                      </button>
                    </div>
                  </div>
                )}

                <div className="modal-body">
                  <h3 className="analysis-title">Analisis del Documento (IA)</h3>
                  <div className="analysis-content">
                    {selectedCorreo.analisis_ia?.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="pdf-viewer-container">
                <div className="pdf-viewer-header">
                  <button className="back-to-email" onClick={() => setShowPdfViewer(false)}>
                    ← Volver al correo
                  </button>
                  <h3>{selectedCorreo.nombre_archivo}</h3>
                  <button className="download-btn-small" onClick={handleDownload}>
                    Descargar
                  </button>
                </div>
                <iframe 
                src={`http://localhost:4000/api/archivos/view/${selectedCorreo.archivo_id}?token=${localStorage.getItem("token")}`}
                className="pdf-iframe"
                title="Visor de PDF"

                
/>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}