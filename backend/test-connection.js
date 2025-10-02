import { pool } from './db.js';

async function testConnection() {
  try {
    console.log('🔄 Intentando conectar a Aiven...');
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('✅ ¡Conexión exitosa!', rows);
    
    // Probar que exista la tabla usuarios
    const [usuarios] = await pool.query('SHOW TABLES LIKE "usuarios"');
    console.log('📋 Tabla usuarios:', usuarios);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('Código:', error.code);
  } finally {
    await pool.end();
  }
}

testConnection();