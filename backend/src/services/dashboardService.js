const pool = require('../config/db');

// RN12: todo indicador aqui vem de uma query real sobre o banco — nada de
// número fixo no código. As decisões de definição de cada indicador (quando
// a spec não deixa 100% explícito) estão comentadas abaixo, para facilitar
// a defesa acadêmica.

// Cards do topo do dashboard (Seção 15).
async function buscarIndicadores() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM incidentes)                                            AS total_incidentes,
      (SELECT COUNT(*) FROM casos WHERE status = 'Em tratativa')                   AS casos_em_tratativa,
      (SELECT COUNT(*) FROM casos WHERE status = 'Aguardando transportadora')      AS aguardando_transportadora,
      (SELECT COUNT(*) FROM casos WHERE status = 'Aguardando cliente')             AS aguardando_cliente,
      (SELECT COUNT(*) FROM casos WHERE status = 'Resolvido')                      AS resolvidos,
      -- "Caso crítico" = prioridade Alta e ainda não finalizado (Resolvido/Cancelado).
      -- Decisão de definição (a spec não define o termo explicitamente).
      (SELECT COUNT(*) FROM casos
        WHERE prioridade = 'Alta' AND status NOT IN ('Resolvido', 'Cancelado'))    AS casos_criticos,
      -- "Clientes afetados" = clientes distintos com casos ainda válidos (não cancelados).
      (SELECT COUNT(DISTINCT cliente) FROM casos WHERE status <> 'Cancelado')      AS clientes_afetados,
      -- "Recontatos" = interações registradas explicitamente com tipo 'Recontato'
      -- (Seção 12 já prevê esse tipo de interação para alimentar este indicador).
      (SELECT COUNT(*) FROM interacoes WHERE tipo = 'Recontato')                   AS recontatos,
      -- "Incidente ativo" = ainda não Resolvido nem Encerrado.
      (SELECT COUNT(*) FROM incidentes
        WHERE status IN ('Aberto', 'Em acompanhamento'))                          AS incidentes_ativos
  `);

  const linha = rows[0];
  // Os COUNT() do Postgres retornam string (bigint); convertendo para número.
  return Object.fromEntries(
    Object.entries(linha).map(([chave, valor]) => [chave, parseInt(valor, 10)])
  );
}

// Gráfico: Casos por categoria
async function casosPorCategoria() {
  const { rows } = await pool.query(`
    SELECT cat.nome AS categoria, COUNT(c.id)::int AS total
    FROM categorias cat
    LEFT JOIN casos c ON c.categoria_id = cat.id
    GROUP BY cat.nome
    ORDER BY total DESC, cat.nome ASC
  `);
  return rows;
}

// Gráfico: Casos por status (inclui status com 0 casos, para o gráfico não "sumir" com eles)
async function casosPorStatus() {
  const { rows } = await pool.query(`
    SELECT s.status, COALESCE(COUNT(c.id), 0)::int AS total
    FROM (VALUES
      ('Novo', 1), ('Em tratativa', 2), ('Aguardando transportadora', 3),
      ('Aguardando cliente', 4), ('Aguardando financeiro', 5),
      ('Resolvido', 6), ('Cancelado', 7)
    ) AS s(status, ordem)
    LEFT JOIN casos c ON c.status = s.status
    GROUP BY s.status, s.ordem
    ORDER BY s.ordem
  `);
  return rows;
}

// Gráfico: Incidentes por prioridade (inclui prioridades com 0 incidentes)
async function incidentesPorPrioridade() {
  const { rows } = await pool.query(`
    SELECT p.prioridade, COALESCE(COUNT(i.id), 0)::int AS total
    FROM (VALUES ('Alta', 1), ('Média', 2), ('Baixa', 3)) AS p(prioridade, ordem)
    LEFT JOIN incidentes i ON i.prioridade = p.prioridade
    GROUP BY p.prioridade, p.ordem
    ORDER BY p.ordem
  `);
  return rows;
}

// Gráfico: Evolução de casos por período — últimos 6 meses, incluindo meses sem casos.
async function evolucaoCasos() {
  const { rows } = await pool.query(`
    WITH meses AS (
      SELECT date_trunc('month', CURRENT_DATE) - (n || ' months')::interval AS mes
      FROM generate_series(5, 0, -1) AS n
    )
    SELECT to_char(m.mes, 'YYYY-MM') AS periodo, COALESCE(COUNT(c.id), 0)::int AS total
    FROM meses m
    LEFT JOIN casos c ON date_trunc('month', c.criado_em) = m.mes
    GROUP BY m.mes
    ORDER BY m.mes
  `);
  return rows;
}

async function buscarDashboard() {
  const [indicadores, categoria, status, prioridade, evolucao] = await Promise.all([
    buscarIndicadores(),
    casosPorCategoria(),
    casosPorStatus(),
    incidentesPorPrioridade(),
    evolucaoCasos(),
  ]);

  return {
    indicadores,
    graficos: {
      casos_por_categoria: categoria,
      casos_por_status: status,
      incidentes_por_prioridade: prioridade,
      evolucao_casos: evolucao,
    },
  };
}

module.exports = { buscarDashboard };
