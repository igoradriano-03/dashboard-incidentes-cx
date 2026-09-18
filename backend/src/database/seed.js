// Seed completo de dados de demonstração (ETAPA 11).
// Este script APAGA os dados transacionais existentes (casos, incidentes,
// interações, atualizações) para garantir um resultado reprodutível a
// cada execução — usuários, categorias e setores NÃO são apagados.
//
// Execução: npm run seed  (dentro da pasta backend/)

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// ----------------------------------------------------------------------
// Utilidades de geração de dados aleatórios (uso interno deste script)
// ----------------------------------------------------------------------
function amostra(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function inteiroEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dataAleatoriaEntre(inicio, fim) {
  const ini = inicio.getTime();
  const fimT = fim.getTime();
  if (fimT <= ini) return new Date(ini);
  return new Date(inteiroEntre(ini, fimT));
}

function paraDataSQL(data) {
  return data.toISOString().slice(0, 10);
}

const CLIENTES = [
  'Ana Souza', 'Bruno Costa', 'Carla Dias', 'Diego Ramos', 'Elaine Prado',
  'Fábio Nunes', 'Gabriela Rocha', 'Henrique Alves', 'Isabela Martins',
  'João Pereira', 'Karina Lopes', 'Lucas Fernandes', 'Mariana Teixeira',
  'Nathan Oliveira', 'Otávio Barros', 'Patrícia Gomes', 'Rafael Cardoso',
  'Sabrina Ferreira', 'Thiago Batista', 'Vanessa Cunha', 'William Castro',
  'Yasmin Ribeiro', 'Zeca Monteiro', 'Beatriz Farias', 'Caio Moraes',
];

const STATUS_CASO = [
  'Novo', 'Em tratativa', 'Aguardando transportadora',
  'Aguardando cliente', 'Aguardando financeiro', 'Resolvido', 'Cancelado',
];
const PRIORIDADES = ['Alta', 'Média', 'Baixa'];
const TIPOS_INTERACAO = [
  'Atendimento inicial', 'Recontato', 'E-mail',
  'WhatsApp', 'Ligação', 'Interno', 'Outro',
];

async function seed() {
  console.log('=== Seed de dados de demonstração — Dashboard de Gestão de Incidentes em CX ===');

  // ----------------------------------------------------------------------
  // 1) Usuários (admin + analistas de demonstração)
  // ----------------------------------------------------------------------
  const senhaAdmin = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO usuarios (nome, email, senha, perfil)
     VALUES ('Administrador CX', 'admin@cxintelligence.com', $1, 'Administrador')
     ON CONFLICT (email) DO NOTHING`,
    [senhaAdmin]
  );

  const senhaAnalista = await bcrypt.hash('analista123', 10);
  const analistas = [
    ['Fernanda Souza', 'fernanda.souza@cxintelligence.com'],
    ['Marcos Lima', 'marcos.lima@cxintelligence.com'],
    ['Juliana Alves', 'juliana.alves@cxintelligence.com'],
  ];
  for (const [nome, email] of analistas) {
    await pool.query(
      `INSERT INTO usuarios (nome, email, senha, perfil)
       VALUES ($1, $2, $3, 'Analista')
       ON CONFLICT (email) DO NOTHING`,
      [nome, email, senhaAnalista]
    );
  }
  console.log('✔ Usuários garantidos (1 administrador + 3 analistas).');

  const { rows: usuarios } = await pool.query('SELECT id, nome FROM usuarios');
  const { rows: categorias } = await pool.query('SELECT id, nome FROM categorias');
  const categoriaIdPorNome = Object.fromEntries(categorias.map((c) => [c.nome, c.id]));

  // ----------------------------------------------------------------------
  // 2) Limpa dados transacionais anteriores (reprodutibilidade do seed)
  // ----------------------------------------------------------------------
  console.log('Limpando casos, incidentes, interações e atualizações anteriores...');
  await pool.query('TRUNCATE TABLE interacoes, atualizacoes_incidente, casos, incidentes RESTART IDENTITY CASCADE');

  const hoje = new Date();
  const seisMesesAtras = new Date(hoje);
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

  // ----------------------------------------------------------------------
  // 3) Incidentes — criados primeiro com um status "aberto" para permitir
  // a associação de casos (a RN10 bloqueia associação a incidente já
  // Encerrado). O status FINAL desejado é aplicado só no passo 5, depois
  // que todos os casos já foram vinculados.
  // ----------------------------------------------------------------------
  const definicaoIncidentes = [
    { nome: 'Pedidos em atraso na região Sudeste', categoria: 'Atraso', prioridade: 'Alta', statusFinal: 'Resolvido', mesesAtras: 5 },
    { nome: 'Produtos faltantes na entrega', categoria: 'Produto faltante', prioridade: 'Alta', statusFinal: 'Em acompanhamento', mesesAtras: 3 },
    { nome: 'Pedidos sem atualização de rastreio', categoria: 'Transportadora', prioridade: 'Média', statusFinal: 'Aberto', mesesAtras: 2 },
    { nome: 'Brindes não enviados — campanha Dia das Mães', categoria: 'Brinde faltante', prioridade: 'Baixa', statusFinal: 'Encerrado', mesesAtras: 4 },
    { nome: 'Falha no checkout com pagamento via PIX', categoria: 'PIX', prioridade: 'Alta', statusFinal: 'Em acompanhamento', mesesAtras: 1 },
    { nome: 'Divergência de endereço em pedidos', categoria: 'Endereço/CEP', prioridade: 'Média', statusFinal: 'Aberto', mesesAtras: 1 },
  ];

  const incidentes = [];

  for (const def of definicaoIncidentes) {
    const dataAbertura = new Date(hoje);
    dataAbertura.setMonth(dataAbertura.getMonth() - def.mesesAtras);
    const responsavel = amostra(usuarios);

    const { rows } = await pool.query(
      `INSERT INTO incidentes (
        codigo, nome, descricao, categoria_id, prioridade, status,
        responsavel_id, data_abertura, criado_em, atualizado_em
      ) VALUES ('TEMP', $1, $2, $3, $4, 'Aberto', $5, $6, $7, $7)
      RETURNING id`,
      [
        def.nome,
        `Incidente de demonstração relacionado à categoria "${def.categoria}".`,
        categoriaIdPorNome[def.categoria],
        def.prioridade,
        responsavel.id,
        paraDataSQL(dataAbertura),
        dataAbertura,
      ]
    );

    const id = rows[0].id;
    const codigo = `INC-${String(id).padStart(3, '0')}`;
    await pool.query('UPDATE incidentes SET codigo = $1 WHERE id = $2', [codigo, id]);

    incidentes.push({
      id,
      codigo,
      categoria: def.categoria,
      statusFinal: def.statusFinal,
      dataAbertura,
      // janela de datas em que casos podem ser gerados/vinculados a este incidente
      dataFimJanela: def.statusFinal === 'Encerrado' || def.statusFinal === 'Resolvido'
        ? dataAleatoriaEntre(dataAbertura, hoje)
        : hoje,
      responsavelId: responsavel.id,
    });
  }
  console.log(`✔ ${incidentes.length} incidentes criados (status "Aberto" temporário).`);

  // ----------------------------------------------------------------------
  // 4) Casos — distribuídos entre categorias, prioridades e status,
  // com datas de criação espalhadas pelos últimos 6 meses (alimenta o
  // gráfico de evolução do dashboard).
  // ----------------------------------------------------------------------
  const TOTAL_CASOS = 70;
  const casosCriados = [];

  for (let i = 1; i <= TOTAL_CASOS; i += 1) {
    const categoria = amostra(categorias);
    const prioridade = amostra(PRIORIDADES);
    const status = amostra(STATUS_CASO);
    const cliente = amostra(CLIENTES);
    const responsavel = amostra(usuarios);

    const dataCriacao = dataAleatoriaEntre(seisMesesAtras, hoje);
    const dataPedido = dataAleatoriaEntre(
      new Date(dataCriacao.getTime() - 5 * 24 * 3600 * 1000),
      dataCriacao
    );

    // Chance de vincular a um incidente compatível (mesma categoria e
    // dentro da janela de tempo em que o incidente ainda aceitava casos).
    const incidentesCompativeis = incidentes.filter(
      (inc) => inc.categoria === categoria.nome
        && dataCriacao >= inc.dataAbertura
        && dataCriacao <= inc.dataFimJanela
    );
    const incidenteVinculado = incidentesCompativeis.length > 0 && Math.random() < 0.65
      ? amostra(incidentesCompativeis)
      : null;

    const finalizado = ['Resolvido', 'Cancelado'].includes(status);
    const prazo = finalizado ? null : dataAleatoriaEntre(dataCriacao, new Date(dataCriacao.getTime() + 10 * 24 * 3600 * 1000));

    const { rows } = await pool.query(
      `INSERT INTO casos (
        numero_pedido, cliente, data_pedido, data_contato, categoria_id,
        prioridade, status, responsavel_id, incidente_id,
        ultima_acao, proxima_acao, prazo, observacoes, criado_em, atualizado_em
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14
      ) RETURNING id`,
      [
        `PED-${10000 + i}`,
        cliente,
        paraDataSQL(dataPedido),
        paraDataSQL(dataCriacao),
        categoria.id,
        prioridade,
        status,
        responsavel.id,
        incidenteVinculado ? incidenteVinculado.id : null,
        'Contato inicial registrado com o cliente.',
        finalizado ? null : 'Acompanhar retorno e atualizar o cliente.',
        prazo ? paraDataSQL(prazo) : null,
        'Caso gerado automaticamente para fins de demonstração acadêmica.',
        dataCriacao,
      ]
    );

    casosCriados.push({ id: rows[0].id, dataCriacao, dataLimite: finalizado ? dataAleatoriaEntre(dataCriacao, hoje) : hoje });
  }
  console.log(`✔ ${casosCriados.length} casos criados, espalhados pelos últimos 6 meses.`);

  // ----------------------------------------------------------------------
  // 5) Agora que todos os casos já foram vinculados, aplica o status
  // FINAL de cada incidente (alguns ficam Encerrado/Resolvido).
  // ----------------------------------------------------------------------
  for (const inc of incidentes) {
    const finalizado = ['Resolvido', 'Encerrado'].includes(inc.statusFinal);
    await pool.query(
      `UPDATE incidentes SET status = $1, data_encerramento = $2 WHERE id = $3`,
      [inc.statusFinal, finalizado ? paraDataSQL(inc.dataFimJanela) : null, inc.id]
    );

    // Timeline do incidente (Seção 11), com datas entre a abertura e o encerramento/hoje.
    const mensagens = [
      'Incidente identificado a partir de múltiplos casos semelhantes.',
      'Casos afetados mapeados e priorizados pela equipe de CX.',
      inc.statusFinal === 'Aberto' ? 'Aguardando retorno do setor responsável.' : 'Setor responsável acionado para tratativa.',
    ];
    if (finalizado) mensagens.push('Situação normalizada. Incidente encerrado.');

    let dataAtual = new Date(inc.dataAbertura);
    for (const mensagem of mensagens) {
      await pool.query(
        `INSERT INTO atualizacoes_incidente (incidente_id, usuario_id, descricao, criado_em)
         VALUES ($1, $2, $3, $4)`,
        [inc.id, amostra(usuarios).id, mensagem, dataAtual]
      );
      dataAtual = dataAleatoriaEntre(dataAtual, inc.dataFimJanela);
    }
  }
  console.log('✔ Status final aplicado aos incidentes e timeline registrada.');

  // ----------------------------------------------------------------------
  // 6) Interações por caso (Seção 12) — inclui o tipo "Recontato" para
  // alimentar o indicador de recontatos do dashboard (RN12).
  // ----------------------------------------------------------------------
  let totalInteracoes = 0;
  for (const caso of casosCriados) {
    const quantidade = inteiroEntre(0, 3);
    let dataAtual = new Date(caso.dataCriacao);

    for (let j = 0; j < quantidade; j += 1) {
      // primeira interação tende a ser "Atendimento inicial"; as demais, variadas
      const tipo = j === 0 ? 'Atendimento inicial' : amostra(TIPOS_INTERACAO);
      const usuario = amostra(usuarios);

      await pool.query(
        `INSERT INTO interacoes (caso_id, usuario_id, tipo, descricao, criado_em)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          caso.id,
          usuario.id,
          tipo,
          `Interação de demonstração (${tipo.toLowerCase()}) registrada para acompanhamento do caso.`,
          dataAtual,
        ]
      );
      totalInteracoes += 1;
      dataAtual = dataAleatoriaEntre(dataAtual, caso.dataLimite);
    }
  }
  console.log(`✔ ${totalInteracoes} interações registradas (incluindo recontatos).`);

  console.log('=== Seed concluído com sucesso ===');
}

seed()
  .catch((err) => {
    console.error('Erro ao executar o seed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
