import { pool } from './db.js';

async function checkUser() {
  try {
    const [users] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', ['correo0@tec.mx']);
    console.log('👤 Usuario encontrado:', users);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();