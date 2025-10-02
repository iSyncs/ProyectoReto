# Proyecto Reto

Este sistema permite a los empleados escanear y enviar documentos legales que son automáticamente analizados por IA (DeepSeek) y enviados al departamento legal. Los abogados pueden revisar los documentos en una bandeja de entrada con vista previa de PDF integrada, mientras que los administradores tienen acceso a un dashboard con métricas y gestión de usuarios.


## 📦 Instalación
Prerrequisitos

Node.js (v16 o superior)
MySQL/MariaDB
Cuenta en OpenRouter (para análisis de IA)

1. Clonar el repositorio
bashgit clone https://github.com/tu-usuario/proyecto-santander.git
cd proyecto-santander
2. Configurar Backend
bashcd backend
npm install
Crear archivo .env:
envDB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=retofinal
DB_PORT=3306
OPENROUTER_API_KEY=tu-api-key-aqui
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
ABOGADO_EMAIL=abogado@santander.mx
3. Configurar Base de Datos
Ejecutar el script SQL en database_setup.sql para crear las tablas:
sqlCREATE DATABASE retofinal;
USE retofinal;
-- Ejecutar el resto del script
4. Configurar Frontend
bashcd ../frontend
npm install
5. Iniciar el Proyecto
Terminal 1 - Backend:
bashcd backend
npm run dev
Terminal 2 - Frontend:
bashcd frontend
npm run dev
El sistema estará disponible en http://localhost:5173

## 🛠️ Tecnologías utilizadas

Frontend

React 19.1.1
React Router DOM 7.8.2
Vite 7.1.2
CSS3 (sin frameworks)
Backend

Node.js
Express 5.1.0
MySQL (MariaDB)
Multer 2.0.2 (gestión de archivos)
PDF-Parse 1.1.1 (extracción de texto)
Axios (API requests)
Nodemailer 7.0.6 (emails)
JWT (autenticación)
IA

OpenRouter API
Modelo: DeepSeek v3.2
