const { Pool } = require('pg');
require('dotenv').config();

// Pool de conexões reutilizável — cada query pega uma conexão emprestada
// e devolve ao pool depois de usar, evitando abrir/fechar conexão a cada request.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Erro inesperado em uma conexão ociosa do PostgreSQL:', err);
});

module.exports = pool;
