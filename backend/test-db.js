import { pool } from './db.js';

(async () => {
  try {
    console.log('Probando conexión...');
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('Resultado:', rows);
    
    // Verificar si existe la tabla usuarios
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tablas encontradas:', tables);
    
    // Intentar obtener usuarios
    const [usuarios] = await pool.query('SELECT * FROM usuarios');
    console.log('Usuarios:', usuarios);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();