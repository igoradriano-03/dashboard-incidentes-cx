const pool = require('../config/db');

async function incidenteExiste(incidenteId) {
  const { rows } = await pool.query('SELECT 1 FROM incidentes WHERE id = $1', [incidenteId]);
  return rows.length > 0;
}

async function listarAtualizacoesPorIncidente(incidenteId) {
  const { rows } = await pool.query(
    `SELECT a.*, u.nome AS usuario_nome
     FROM atualizacoes_incidente a
     LEFT JOIN usuarios u ON u.id = a.usuario_id
     WHERE a.incidente_id = $1
     ORDER BY a.criado_em ASC`,
    [incidenteId]
  );
  return rows;
}

async function criarAtualizacao(incidenteId, usuarioId, descricao) {
  const { rows } = await pool.query(
    `INSERT INTO atualizacoes_incidente (incidente_id, usuario_id, descricao)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [incidenteId, usuarioId, descricao]
  );

  const { rows: usuarioRows } = await pool.query('SELECT nome FROM usuarios WHERE id = $1', [usuarioId]);

  return { ...rows[0], usuario_nome: usuarioRows[0]?.nome || null };
}

module.exports = { incidenteExiste, listarAtualizacoesPorIncidente, criarAtualizacao };
