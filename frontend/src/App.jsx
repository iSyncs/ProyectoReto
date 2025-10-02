import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Recover from "./pages/Recover.jsx";
import Index from "./pages/Index.jsx";
import Correo from "./pages/Correo.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Manual from "./pages/Manual.jsx";
import Videojuego from "./pages/Videojuego.jsx";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import GestionUsuarios from "./pages/GestionUsuarios.jsx";
import "./styles/Login.css";

function Layout() {
  const location = useLocation();
  const hideNavAndFooter = location.pathname === "/" || location.pathname === "/recover" || location.pathname === "/gestionusuarios";
  return (
    <>
      {!hideNavAndFooter && <NavBar />}
      <Outlet />
      {!hideNavAndFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/recover" element={<Recover />} />

        <Route element={<Layout />}>
          <Route 
            path="/index" 
            element={
              <ProtectedRoute allowedRoles={['empleado']}>
                <Index />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/correo" 
            element={
              <ProtectedRoute allowedRoles={['abogado']}>
                <Correo />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/manual" 
            element={
              <ProtectedRoute allowedRoles={['empleado', 'abogado', 'admin']}>
                <Manual />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/videojuego" 
            element={
              <ProtectedRoute allowedRoles={['empleado', 'abogado', 'admin']}>
                <Videojuego />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gestion-usuarios" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
              <GestionUsuarios />
              </ProtectedRoute>
            } 
/>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;