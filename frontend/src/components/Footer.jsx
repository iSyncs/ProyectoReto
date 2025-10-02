import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-columns">
        <div>
          <h3>Servicios</h3>
          <ul>
            <li>Banca digital</li>
            <li>Tarjetas de crédito</li>
            <li>Créditos y prestamos</li>
            <li>Inversión</li>
          </ul>
        </div>
        <div>
          <h3>Atención al cliente</h3>
          <ul>
            <li>Ayuda en línea</li>
            <li>Preguntas frecuentes</li>
            <li>Contacto</li>
            <li>Localiza tu sucursal</li>
          </ul>
        </div>
        <div>
          <h3>Informacion legal</h3>
          <ul>
            <li>Aviso de privacidad</li>
            <li>Términos y condiciones</li>
            <li>Seguridad</li>
            <li>Transparencia</li>
          </ul>
        </div>
        <div>
          <h3>Nosotros</h3>
          <ul>
            <li>Quiénes somos</li>
            <li>Sustentabilidad</li>
            <li>Sala de prensa</li>
            <li>Bolsa de trabajo</li>
          </ul>
        </div>
      </div>
      <div className="footer-legal">
        Derechos Reservados 2025, Banco Santander México S.A., Institución de Banca Múltiple, Grupo Financiero Santander México
      </div>
    </footer>
  );
}