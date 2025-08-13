const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_v0',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a la base de datos:', err);
});

// Function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en consulta:', error);
    throw error;
  }
};

// Function to get a client from the pool
const getClient = async () => {
  return await pool.connect();
};

module.exports = {
  query,
  getClient,
  pool
};



/*query('SELECT * FROM users')
  .then(res => {
    console.log('👥 Lista de usuarios:', res.rows);
    process.exit(); // Finaliza el proceso
  })
*/
/*query('SELECT NOW()')
  .then(res => {
    console.log('🕒 Resultado de prueba:', res.rows);
    process.exit(); // Finaliza el proceso
  })
  .catch(err => {
    console.error('❌ Error al ejecutar consulta de prueba:', err);
    process.exit(1);
  });
*/