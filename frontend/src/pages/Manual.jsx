import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import "../styles/App.css";
import uml from "../assets/UML.jpg";

export default function Manual() {
  return (
    <>
      <main className="index-main">
        <h2 className="manual-title">
          Tu <span className="manual-title-red"> guía </span> paso a paso para <span className="manual-title-red"> dominar </span> el proceso
        </h2>
        <p className="index-descripcion">
          El Manual de Uso es una herramienta diseñada para guiar a los empleados en cada etapa 
          del proceso de escaneo y envío de documentos. Aquí encontrarás de forma clara y sencilla 
          todos los pasos que debes seguir para realizar correctamente tus tareas diarias, evitando 
          errores y asegurando un flujo de trabajo eficiente.
          <br /><br />
          Este manual no es solo un documento tradicional: forma parte de la estrategia de capacitación 
          digital, ya que se integra con nuestro videojuego prototipo. A través de la gamificación, 
          transformamos el aprendizaje del manual en una experiencia interactiva y entretenida, en 
          donde cada paso se convierte en un reto y cada logro en un avance dentro de tu capacitación.
          <br /><br />
          Con este enfoque, buscamos que el proceso de aprender sea más ágil, motivador y memorable, 
          permitiendo que los empleados se familiaricen rápidamente con las herramientas y prácticas 
          necesarias en su día a día.
        </p>

        <div className="manual-diagrama">
          <img src={uml} alt="uml" />
        </div>
        
        <h2 className="manual-subtitle">
          Aprender <span className="manual-title-red"> nunca </span> había sido tan <span className="manual-title-red"> fácil </span>y entretenido
        </h2>
        <p className="index-descripcion">
          Ingresa al <a href="./Videojuego">videojuego</a> y pon en práctica tus conocimientos en un entorno dinámico y gamificado.
        </p>
      </main>
    </>
  );
}
