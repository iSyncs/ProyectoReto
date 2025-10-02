import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import nodemailer from 'nodemailer';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, DOC, DOCX, XLS, XLSX'));
    }
  }
});

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });

  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'tu_secreto');
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// ============ AUTENTICACIÓN ============
app.post('/api/login', async (req, res) => {
  const { correo, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    const user = rows[0];
    if (user.contrasena !== password) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ id: user.id, correo: user.correo }, 'tu_secreto', { expiresIn: '8h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/api/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });

  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'tu_secreto');
    const [rows] = await pool.query(
      'SELECT id, nombre, apellido_p, puesto FROM usuarios WHERE id = ?', 
      [decoded.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

// ============ SUBIDA CON ANÁLISIS IA Y ENVÍO DE EMAIL ============
app.post('/api/upload-and-analyze', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    console.log('📁 Archivo recibido:', req.file.originalname);

    // 1. Guardar archivo en BD
    const [resultArchivo] = await pool.query(
      'INSERT INTO archivos (usuario_id, nombre_original, nombre_guardado, ruta, tamano, tipo, fecha_subida) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [req.userId, req.file.originalname, req.file.filename, req.file.path, req.file.size, req.file.mimetype]
    );
    const archivoId = resultArchivo.insertId;
    console.log('✅ Archivo guardado en BD, ID:', archivoId);

    // 2. Obtener información del remitente
    const [userRows] = await pool.query('SELECT nombre, apellido_p FROM usuarios WHERE id = ?', [req.userId]);
    const remitente = userRows[0];
    const nombreCompleto = `${remitente.nombre} ${remitente.apellido_p}`;

    let analisisIA = 'Documento adjunto para revisión.';
// 3. Analizar PDF con IA
if (req.file.mimetype === 'application/pdf') {
  try {
    console.log('🤖 Analizando PDF con IA...');
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    if (pdfData.text && pdfData.text.length > 50) {
      if (!OPENROUTER_API_KEY) {
        console.warn('⚠️ No hay API key de OpenRouter configurada');
        analisisIA = 'Documento adjunto para revision manual.';
      } else {
        const response = await axios.post(
          OPENROUTER_API_URL,
          {
            model: 'deepseek/deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'Eres un asistente legal. Proporciona analisis breves y concisos en formato de bullet points.'
              },
              {
                role: 'user',
                content: `Analiza este documento legal y lista unicamente los puntos clave en formato bullet:
- Tipo de documento
- Nombres mencionados
- Fechas importantes
- Montos (si aplica)
- Urgencia o prioridad
- Accion requerida

Documento:
${pdfData.text.substring(0, 15000)}`
              }
            ],
            temperature: 0.3,
            max_tokens: 800
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:5173',
              'X-Title': 'Sistema Legal Santander'
            }
          }
        );
        analisisIA = response.data.choices[0].message.content;
        console.log('✅ Analisis completado');
      }
    } else {
      analisisIA = 'No se pudo extraer texto del PDF.';
    }
  } catch (aiError) {
    console.error('⚠️ Error en analisis IA:', aiError.response?.data || aiError.message);
    analisisIA = 'Analisis automatico no disponible.';
  }
} else {
  analisisIA = 'Analisis de IA solo disponible para archivos PDF.';
}
    // 4. Guardar correo en BD
    const [resultCorreo] = await pool.query(
      'INSERT INTO correos (remitente_id, remitente_nombre, destinatario, asunto, archivo_id, nombre_archivo, analisis_ia, fecha_envio) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [req.userId, nombreCompleto, process.env.ABOGADO_EMAIL || 'abogado@santander.mx', `Nuevo documento: ${req.file.originalname}`, archivoId, req.file.originalname, analisisIA]
    );
    console.log('✅ Correo guardado en BD');

    // 5. Enviar email
try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ABOGADO_EMAIL || 'abogado@santander.mx',
      subject: `Nuevo documento de ${nombreCompleto}: ${req.file.originalname}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e60000;">Nuevo documento recibido</h2>
          
          <p>Estimado Abogado,</p>
          
          <p>Le adjunto un archivo escaneado para su revision y tramite correspondiente.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Remitente:</strong> ${nombreCompleto}</p>
            <p><strong>Archivo:</strong> ${req.file.originalname}</p>
            <p><strong>Tamaño:</strong> ${(req.file.size / 1024).toFixed(2)} KB</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
          </div>
          
          <h3 style="color: #333; border-bottom: 2px solid #e60000; padding-bottom: 5px;">
            Analisis Preliminar (IA)
          </h3>
          <div style="background: #fff; padding: 15px; border-left: 4px solid #e60000; margin: 20px 0;">
            ${analisisIA.replace(/\n/g, '<br>')}
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px;">
            Este correo fue generado automaticamente por el sistema de gestion documental de Santander.
          </p>
        </div>
      `,
      attachments: [{ filename: req.file.originalname, path: req.file.path }]
    };
    await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado');
  }
} catch (emailError) {
  console.error('⚠️ Error al enviar email:', emailError.message);
}

    // 6. Responder exitosamente
    res.json({
      message: 'Archivo procesado y enviado exitosamente',
      file: { id: archivoId, nombre: req.file.originalname, tamano: req.file.size },
      correo: { id: resultCorreo.insertId, analisis: analisisIA }
    });

  } catch (err) {
    console.error('❌ Error en upload-and-analyze:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      message: 'Error al procesar el archivo',
      error: err.message 
    });
  }
});

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(uploadsDir));
// Endpoint para visualizar PDF con token en query string
app.get('/api/archivos/view/:id', async (req, res) => {
  try {
    // Obtener token desde query string (para iframes)
    const token = req.query.token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token' });
    }

    // Verificar token
    let userId;
    try {
      const decoded = jwt.verify(token, 'tu_secreto');
      userId = decoded.id;
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const [archivos] = await pool.query(
      'SELECT * FROM archivos WHERE id = ?',
      [req.params.id]
    );

    if (archivos.length === 0) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    const archivo = archivos[0];
    
    if (!archivo.tipo.includes('pdf')) {
      return res.status(400).json({ message: 'Solo se pueden visualizar PDFs' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    
    const fileStream = fs.createReadStream(archivo.ruta);
    fileStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al visualizar archivo' });
  }
});

// Endpoint para descargar con autenticación normal
app.get('/api/archivos/download/:id', verifyToken, async (req, res) => {
  try {
    const [archivos] = await pool.query(
      'SELECT * FROM archivos WHERE id = ?',
      [req.params.id]
    );

    if (archivos.length === 0) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    const archivo = archivos[0];
    res.download(archivo.ruta, archivo.nombre_original);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al descargar archivo' });
  }
});

// ============ DASHBOARD STATS (Solo para admin) ============
app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
  try {
    // Verificar que sea admin
    const [userCheck] = await pool.query('SELECT puesto FROM usuarios WHERE id = ?', [req.userId]);
    if (userCheck[0].puesto !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Estadísticas generales
    const [correosStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_correos,
        SUM(CASE WHEN leido = 0 THEN 1 ELSE 0 END) as no_leidos,
        SUM(CASE WHEN leido = 1 THEN 1 ELSE 0 END) as leidos
      FROM correos
    `);

    const [archivosStats] = await pool.query('SELECT COUNT(*) as total_archivos FROM archivos');
    
    const [usuariosStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_usuarios,
        SUM(CASE WHEN puesto = 'empleado' THEN 1 ELSE 0 END) as empleados,
        SUM(CASE WHEN puesto = 'abogado' THEN 1 ELSE 0 END) as abogados
      FROM usuarios
    `);

    // Top empleados por documentos enviados
    const [topEmpleados] = await pool.query(`
      SELECT 
        u.nombre,
        u.apellido_p as apellido,
        COUNT(a.id) as total
      FROM usuarios u
      LEFT JOIN archivos a ON u.id = a.usuario_id
      WHERE u.puesto = 'empleado'
      GROUP BY u.id
      ORDER BY total DESC
      LIMIT 10
    `);

    // Correos recientes
    const [recentCorreos] = await pool.query(`
      SELECT remitente_nombre, fecha_envio, leido
      FROM correos
      ORDER BY fecha_envio DESC
      LIMIT 20
    `);

    res.json({
      stats: {
        ...correosStats[0],
        ...archivosStats[0],
        ...usuariosStats[0]
      },
      topEmpleados,
      recentCorreos
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// ============ ENDPOINTS PARA CORREO.JSX ============
app.get('/api/correos', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.remitente_nombre, c.destinatario, c.asunto, c.nombre_archivo, c.analisis_ia, c.fecha_envio, c.leido
       FROM correos c ORDER BY c.fecha_envio DESC`
    );
    res.json({ correos: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener correos' });
  }
});

// ============ REGISTRO DE NUEVOS USUARIOS (Solo admin) ============
app.post('/api/admin/create-user', verifyToken, async (req, res) => {
  try {
    // Verificar que sea admin
    const [userCheck] = await pool.query('SELECT puesto FROM usuarios WHERE id = ?', [req.userId]);
    if (userCheck[0].puesto !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
    }

    const { nombre, apellido_p, apellido_m, puesto } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido_p || !puesto) {
      return res.status(400).json({ message: 'Nombre, apellido paterno y puesto son requeridos' });
    }

    // Validar puesto
    if (!['empleado', 'abogado', 'admin'].includes(puesto)) {
      return res.status(400).json({ message: 'Puesto inválido' });
    }

    // Generar correo automático (basado en nombre.apellido + número único)
    const nombreLimpio = nombre.toLowerCase().replace(/\s+/g, '');
    const apellidoLimpio = apellido_p.toLowerCase().replace(/\s+/g, '');
    let correoBase = `${nombreLimpio}.${apellidoLimpio}@santander.mx`;
    
    // Verificar si el correo ya existe y agregar número
    let correo = correoBase;
    let contador = 1;
    while (true) {
      const [existe] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
      if (existe.length === 0) break;
      correo = `${nombreLimpio}.${apellidoLimpio}${contador}@santander.mx`;
      contador++;
    }

    // Generar contraseña aleatoria (8 caracteres: letras y números)
    const generarPassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    const password = generarPassword();

    // Insertar usuario
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, apellido_p, apellido_m, puesto, correo, contrasena) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido_p, apellido_m || '', puesto, correo, password]
    );

    res.json({
      message: 'Usuario creado exitosamente',
      usuario: {
        id: result.insertId,
        nombre: nombre,
        apellido_p: apellido_p,
        apellido_m: apellido_m || '',
        puesto: puesto,
        correo: correo,
        password: password
      }
    });

  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

app.get('/api/correos/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, a.ruta as archivo_ruta FROM correos c
       LEFT JOIN archivos a ON c.archivo_id = a.id WHERE c.id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Correo no encontrado' });
    }
    
    await pool.query('UPDATE correos SET leido = TRUE WHERE id = ?', [req.params.id]);
    res.json({ correo: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener correo' });
  }
});

app.listen(4000, () => console.log('Servidor corriendo en puerto 4000'));