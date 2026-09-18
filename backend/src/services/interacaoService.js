const pool = require('../config/db');

async function casoExiste(casoId) {
  const { rows } = await pool.query('SELECT 1 FROM casos WHERE id = $1', [casoId]);
  return rows.length > 0;
}

async function listarInteracoesPorCaso(casoId) {
  const { rows } = await pool.query(
    `SELECT i.*, u.nome AS usuario_nome
     FROM interacoes i
     LEFT JOIN usuarios u ON u.id = i.usuario_id
     WHERE i.caso_id = $1
     ORDER BY i.criado_em ASC`,
    [casoId]
  );
  return rows;
}

async function criarInteracao(casoId, usuarioId, { tipo, descricao }) {
  const { rows } = await pool.query(
    `INSERT INTO interacoes (caso_id, usuario_id, tipo, descricao)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [casoId, usuarioId, tipo, descricao]
  );

  const { rows: usuarioRows } = await pool.query('SELECT nome FROM usuarios WHERE id = $1', [usuarioId]);

  return { ...rows[0], usuario_nome: usuarioRows[0]?.nome || null };
}

module.exports = { casoExiste, listarInteracoesPorCaso, criarInteracao };
