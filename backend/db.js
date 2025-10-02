import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'retofinal',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a MySQL local exitosamente');
    console.log(`📊 Base de datos: ${process.env.DB_NAME || 'retofinal'}`);
    console.log(`🔗 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    connection.release();
  } catch (err) {
    console.error('❌ Error de conexión a MySQL:');
    console.error('Código:', err.code);
    console.error('Mensaje:', err.message);
    console.error('\n🔍 Verifica:');
    console.error('1. MySQL está corriendo');
    console.error('2. Usuario y contraseña correctos en .env');
    console.error('3. La base de datos "retofinal" existe');
  }
})();