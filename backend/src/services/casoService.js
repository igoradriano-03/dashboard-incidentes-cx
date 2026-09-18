const pool = require('../config/db');

// Colunas permitidas para ordenação — evita SQL injection via query string.
const COLUNAS_ORDENACAO = [
  'id', 'numero_pedido', 'cliente', 'data_pedido', 'data_contato',
  'prioridade', 'status', 'prazo', 'criado_em', 'atualizado_em',
];

const SELECT_BASE = `
  SELECT
    c.*,
    cat.nome        AS categoria_nome,
    resp.nome       AS responsavel_nome,
    inc.codigo      AS incidente_codigo,
    inc.nome        AS incidente_nome
  FROM casos c
  LEFT JOIN categorias cat ON cat.id = c.categoria_id
  LEFT JOIN usuarios resp  ON resp.id = c.responsavel_id
  LEFT JOIN incidentes inc ON inc.id = c.incidente_id
`;

// Monta cláusula WHERE dinâmica a partir dos filtros recebidos, sempre
// usando parâmetros ($1, $2...) para evitar SQL injection.
function montarFiltros(filtros) {
  const condicoes = [];
  const valores = [];

  if (filtros.status) {
    valores.push(filtros.status);
    condicoes.push(`c.status = $${valores.length}`);
  }
  if (filtros.prioridade) {
    valores.push(filtros.prioridade);
    condicoes.push(`c.prioridade = $${valores.length}`);
  }
  if (filtros.categoria_id) {
    valores.push(filtros.categoria_id);
    condicoes.push(`c.categoria_id = $${valores.length}`);
  }
  if (filtros.incidente_id) {
    valores.push(filtros.incidente_id);
    condicoes.push(`c.incidente_id = $${valores.length}`);
  }
  if (filtros.responsavel_id) {
    valores.push(filtros.responsavel_id);
    condicoes.push(`c.responsavel_id = $${valores.length}`);
  }
  if (filtros.busca) {
    valores.push(`%${filtros.busca}%`);
    condicoes.push(`(c.cliente ILIKE $${valores.length} OR c.numero_pedido ILIKE $${valores.length})`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  return { where, valores };
}

async function listarCasos(filtros) {
  const { where, valores } = montarFiltros(filtros);

  const pagina = Math.max(parseInt(filtros.pagina, 10) || 1, 1);
  const limite = Math.min(Math.max(parseInt(filtros.limite, 10) || 20, 1), 100);
  const offset = (pagina - 1) * limite;

  const ordenarPor = COLUNAS_ORDENACAO.includes(filtros.ordenarPor) ? filtros.ordenarPor : 'criado_em';
  const ordem = filtros.ordem === 'asc' ? 'ASC' : 'DESC';

  const queryDados = `
    ${SELECT_BASE}
    ${where}
    ORDER BY c.${ordenarPor} ${ordem}
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}
  `;
  const queryTotal = `SELECT COUNT(*) FROM casos c ${where}`;

  const [resultadoDados, resultadoTotal] = await Promise.all([
    pool.query(queryDados, [...valores, limite, offset]),
    pool.query(queryTotal, valores),
  ]);

  const total = parseInt(resultadoTotal.rows[0].count, 10);

  return {
    dados: resultadoDados.rows,
    total,
    pagina,
    totalPaginas: Math.ceil(total / limite) || 1,
  };
}

async function buscarCasoPorId(id) {
  const { rows } = await pool.query(`${SELECT_BASE} WHERE c.id = $1`, [id]);
  const caso = rows[0];
  if (!caso) return null;

  // Seção 18 (Detalhes do Caso) exige a timeline de interações junto com o caso.
  const { rows: interacoes } = await pool.query(
    `SELECT i.*, u.nome AS usuario_nome
     FROM interacoes i
     LEFT JOIN usuarios u ON u.id = i.usuario_id
     WHERE i.caso_id = $1
     ORDER BY i.criado_em ASC`,
    [id]
  );

  return { ...caso, interacoes };
}

async function criarCaso(dados) {
  const {
    numero_pedido, cliente, data_pedido, data_contato, categoria_id,
    prioridade, status, responsavel_id, incidente_id, link_atendimento,
    ultima_acao, proxima_acao, prazo, observacoes,
  } = dados;

  const { rows } = await pool.query(
    `INSERT INTO casos (
      numero_pedido, cliente, data_pedido, data_contato, categoria_id,
      prioridade, status, responsavel_id, incidente_id, link_atendimento,
      ultima_acao, proxima_acao, prazo, observacoes
    ) VALUES ($1,$2,$3,COALESCE($4, CURRENT_DATE),$5,$6,COALESCE($7,'Novo'),$8,$9,$10,$11,$12,$13,$14)
    RETURNING *`,
    [
      numero_pedido, cliente, data_pedido || null, data_contato || null, categoria_id,
      prioridade, status || null, responsavel_id || null, incidente_id || null,
      link_atendimento || null, ultima_acao || null, proxima_acao || null,
      prazo || null, observacoes || null,
    ]
  );

  return buscarCasoPorId(rows[0].id);
}

// Atualização parcial: só altera as colunas efetivamente enviadas no corpo da requisição.
async function atualizarCaso(id, dados) {
  const camposPermitidos = [
    'numero_pedido', 'cliente', 'data_pedido', 'data_contato', 'categoria_id',
    'prioridade', 'status', 'responsavel_id', 'incidente_id', 'link_atendimento',
    'ultima_acao', 'proxima_acao', 'prazo', 'observacoes',
  ];

  const sets = [];
  const valores = [];

  camposPermitidos.forEach((campo) => {
    if (Object.prototype.hasOwnProperty.call(dados, campo)) {
      valores.push(dados[campo] === '' ? null : dados[campo]);
      sets.push(`${campo} = $${valores.length}`);
    }
  });

  if (sets.length === 0) {
    return buscarCasoPorId(id);
  }

  valores.push(id);
  const { rows } = await pool.query(
    `UPDATE casos SET ${sets.join(', ')} WHERE id = $${valores.length} RETURNING id`,
    valores
  );

  if (!rows[0]) return null;
  return buscarCasoPorId(rows[0].id);
}

async function removerCaso(id) {
  const { rows } = await pool.query('DELETE FROM casos WHERE id = $1 RETURNING id', [id]);
  return rows[0] || null;
}

module.exports = {
  listarCasos,
  buscarCasoPorId,
  criarCaso,
  atualizarCaso,
  removerCaso,
};
