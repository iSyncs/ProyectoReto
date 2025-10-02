import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/App.css";
import imgcap1 from "../assets/capacitacion.png";
import imgcap2 from "../assets/capacitacion2.png";
import imgpdf from "../assets/pdf_img_send.png";

export default function Index() {
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Por favor selecciona un archivo primero");
      return;
    }

    setUploading(true);
    setUploadMessage("Procesando y enviando al abogado...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:4000/api/upload-and-analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        setUploadMessage("Archivo enviado exitosamente al departamento legal");
        setSelectedFile(null);
        document.getElementById("fileInput").value = "";
        
        setTimeout(() => {
          setUploadMessage("");
        }, 5000);
      } else {
        const error = await res.json();
        setUploadMessage(`Error: ${error.message || "No se pudo subir el archivo"}`);
      }
    } catch (err) {
      setUploadMessage("Error al subir el archivo. Intenta nuevamente.");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return <div style={{padding:20}}>Cargando...</div>;

  return (
    <main className="index-main">
      <h1 className="index-title">
        Bienvenido, {user.nombre} {user.apellido_p}
      </h1>
      <p className="index-puesto">
        Puesto: <span className="index-puesto-rol">{user.puesto}</span>
      </p>

      <h2 className="index-h2">
        Recuerda lo que aprendiste <span className="index-jugando">jugando</span>
      </h2>
      <p className="index-descripcion">
        Sube tus documentos escaneados y se enviaran automaticamente al departamento legal
        para su revision y tramite correspondiente.
      </p>

      <div className="index-image-placeholder">
        <img className="img_index" src={imgcap1} alt="Capacitacion 1" />
        <img className="img_index" src={imgcap2} alt="Capacitacion 2" />
      </div>

        <div className="upload-section">
        <div className="file-upload-container">
          <label htmlFor="fileInput" className="file-upload-label">
            Seleccionar archivo
          </label>
          <input
            id="fileInput"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            className="file-input-hidden"
            disabled={uploading}
          />
        </div>
        
        {selectedFile && (
          <div className="file-info">
            <p className="selected-file-name">
              Archivo seleccionado: <strong>{selectedFile.name}</strong>
            </p>
            <p className="selected-file-size">
              ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          </div>
        )}

        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading}
          className="send-to-lawyer-button"
        >
          {uploading ? "Enviando..." : "Enviar al Abogado"}
        </button>

        {uploadMessage && (
          <div className={`upload-message ${uploadMessage.includes("Error") ? "error" : "success"}`}>
            {uploadMessage}
          </div>
        )}
      </div>
    </main>
  );
}