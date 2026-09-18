const pool = require('../config/db');

const COLUNAS_ORDENACAO = [
  'id', 'codigo', 'nome', 'prioridade', 'status',
  'data_abertura', 'criado_em', 'atualizado_em',
];

// RN11: a quantidade de casos é sempre CALCULADA via COUNT(), nunca armazenada
// em uma coluna própria — por isso o subselect abaixo em vez de um contador salvo.
const SELECT_BASE = `
  SELECT
    i.*,
    cat.nome  AS categoria_nome,
    resp.nome AS responsavel_nome,
    COALESCE(cc.total_casos, 0) AS total_casos
  FROM incidentes i
  LEFT JOIN categorias cat ON cat.id = i.categoria_id
  LEFT JOIN usuarios resp  ON resp.id = i.responsavel_id
  LEFT JOIN (
    SELECT incidente_id, COUNT(*) AS total_casos
    FROM casos
    GROUP BY incidente_id
  ) cc ON cc.incidente_id = i.id
`;

function montarFiltros(filtros) {
  const condicoes = [];
  const valores = [];

  if (filtros.status) {
    valores.push(filtros.status);
    condicoes.push(`i.status = $${valores.length}`);
  }
  if (filtros.prioridade) {
    valores.push(filtros.prioridade);
    condicoes.push(`i.prioridade = $${valores.length}`);
  }
  if (filtros.categoria_id) {
    valores.push(filtros.categoria_id);
    condicoes.push(`i.categoria_id = $${valores.length}`);
  }
  if (filtros.responsavel_id) {
    valores.push(filtros.responsavel_id);
    condicoes.push(`i.responsavel_id = $${valores.length}`);
  }
  if (filtros.busca) {
    valores.push(`%${filtros.busca}%`);
    condicoes.push(`(i.nome ILIKE $${valores.length} OR i.codigo ILIKE $${valores.length})`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  return { where, valores };
}

async function listarIncidentes(filtros) {
  const { where, valores } = montarFiltros(filtros);

  const pagina = Math.max(parseInt(filtros.pagina, 10) || 1, 1);
  const limite = Math.min(Math.max(parseInt(filtros.limite, 10) || 20, 1), 100);
  const offset = (pagina - 1) * limite;

  const ordenarPor = COLUNAS_ORDENACAO.includes(filtros.ordenarPor) ? filtros.ordenarPor : 'atualizado_em';
  const ordem = filtros.ordem === 'asc' ? 'ASC' : 'DESC';

  const queryDados = `
    ${SELECT_BASE}
    ${where}
    ORDER BY i.${ordenarPor} ${ordem}
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}
  `;
  const queryTotal = `SELECT COUNT(*) FROM incidentes i ${where}`;

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

async function buscarIncidentePorId(id) {
  const { rows } = await pool.query(`${SELECT_BASE} WHERE i.id = $1`, [id]);
  const incidente = rows[0];
  if (!incidente) return null;

  // Indicadores da tela de Detalhes do Incidente (Seção 21).
  // "Recontatos" depende da tabela de interações (ETAPA 7) e será somado
  // ao endpoint quando essa etapa existir — por ora os indicadores calculados
  // aqui usam apenas dados já disponíveis (casos).
  const { rows: indicadoresRows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'Resolvido')                          AS casos_resolvidos,
       COUNT(*) FILTER (WHERE status NOT IN ('Resolvido', 'Cancelado'))      AS casos_em_tratamento,
       COUNT(DISTINCT cliente)                                               AS clientes_afetados
     FROM casos
     WHERE incidente_id = $1`,
    [id]
  );

  const casosRelacionados = await pool.query(
    `SELECT c.*, cat.nome AS categoria_nome, resp.nome AS responsavel_nome
     FROM casos c
     LEFT JOIN categorias cat ON cat.id = c.categoria_id
     LEFT JOIN usuarios resp  ON resp.id = c.responsavel_id
     WHERE c.incidente_id = $1
     ORDER BY c.criado_em DESC`,
    [id]
  );

  const timeline = await pool.query(
    `SELECT a.*, u.nome AS usuario_nome
     FROM atualizacoes_incidente a
     LEFT JOIN usuarios u ON u.id = a.usuario_id
     WHERE a.incidente_id = $1
     ORDER BY a.criado_em ASC`,
    [id]
  );

  return {
    ...incidente,
    indicadores: {
      total_casos: parseInt(incidente.total_casos, 10),
      casos_resolvidos: parseInt(indicadoresRows[0].casos_resolvidos, 10),
      casos_em_tratamento: parseInt(indicadoresRows[0].casos_em_tratamento, 10),
      clientes_afetados: parseInt(indicadoresRows[0].clientes_afetados, 10),
    },
    casos: casosRelacionados.rows,
    timeline: timeline.rows,
  };
}

// Gera o código sequencial (INC-001, INC-002...) dentro da mesma transação
// do INSERT, para nunca expor um incidente sem código.
async function criarIncidente(dados) {
  const {
    nome, descricao, categoria_id, prioridade, status,
    responsavel_id, data_abertura,
  } = dados;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const placeholder = `TEMP-${Date.now()}`;

    const insercao = await client.query(
      `INSERT INTO incidentes (
        codigo, nome, descricao, categoria_id, prioridade, status,
        responsavel_id, data_abertura
      ) VALUES ($1,$2,$3,$4,$5,COALESCE($6,'Aberto'),$7,COALESCE($8, CURRENT_DATE))
      RETURNING id`,
      [placeholder, nome, descricao || null, categoria_id, prioridade, status || null, responsavel_id, data_abertura || null]
    );

    const novoId = insercao.rows[0].id;
    const codigo = `INC-${String(novoId).padStart(3, '0')}`;

    await client.query('UPDATE incidentes SET codigo = $1 WHERE id = $2', [codigo, novoId]);

    await client.query('COMMIT');
    return buscarIncidentePorId(novoId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function atualizarIncidente(id, dados) {
  const camposPermitidos = [
    'nome', 'descricao', 'categoria_id', 'prioridade', 'status',
    'responsavel_id', 'data_abertura', 'data_encerramento',
  ];

  const sets = [];
  const valores = [];

  camposPermitidos.forEach((campo) => {
    if (Object.prototype.hasOwnProperty.call(dados, campo)) {
      valores.push(dados[campo] === '' ? null : dados[campo]);
      sets.push(`${campo} = $${valores.length}`);
    }
  });

  // Decisão de negócio (não é uma RN explícita da spec, documentada aqui):
  // ao mudar o status PARA "Encerrado", preenche data_encerramento automaticamente
  // se ela não foi enviada; ao reabrir (mudar de "Encerrado" para outro status),
  // limpa data_encerramento, já que RN10 trata reabertura como pré-condição
  // para receber novos casos.
  if (dados.status === 'Encerrado' && !Object.prototype.hasOwnProperty.call(dados, 'data_encerramento')) {
    valores.push(new Date().toISOString().slice(0, 10));
    sets.push(`data_encerramento = $${valores.length}`);
  }
  if (dados.status && dados.status !== 'Encerrado' && !Object.prototype.hasOwnProperty.call(dados, 'data_encerramento')) {
    sets.push('data_encerramento = NULL');
  }

  if (sets.length === 0) {
    return buscarIncidentePorId(id);
  }

  valores.push(id);
    const { rows } = await pool.query(
      `UPDATE incidentes SET ${sets.join(', ')} WHERE id = $${valores.length} RETURNING id`,
      valores
    );

 // Fechamento em lote dos casos vinculados
    if (dados.status === 'Encerrado' || dados.status === 'Resolvido') {
      await pool.query(
        `UPDATE casos 
         SET status = 'Resolvido', atualizado_em = NOW() 
         WHERE incidente_id = $1`,
        [id]
      );
    }

    if (!rows[0]) return null;
    return buscarIncidentePorId(rows[0].id);
}

module.exports = {
  listarIncidentes,
  buscarIncidentePorId,
  criarIncidente,
  atualizarIncidente,
};