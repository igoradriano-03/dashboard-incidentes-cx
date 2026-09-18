const { body, param } = require('express-validator');

const STATUS_VALIDOS = [
  'Novo', 'Em tratativa', 'Aguardando transportadora',
  'Aguardando cliente', 'Aguardando financeiro', 'Resolvido', 'Cancelado',
];
const PRIORIDADES_VALIDAS = ['Alta', 'Média', 'Baixa'];

// POST /api/casos — RN01, RN02, RN03: categoria, status e prioridade obrigatórios.
// status tem default 'Novo' no banco, então aqui só validamos SE for enviado.
const criarCasoValidator = [
  body('numero_pedido').notEmpty().withMessage('O número do pedido é obrigatório.'),
  body('cliente').notEmpty().withMessage('O nome do cliente é obrigatório.'),
  body('categoria_id').notEmpty().withMessage('A categoria é obrigatória.').bail().isInt().withMessage('Categoria inválida.'),
  body('prioridade').notEmpty().withMessage('A prioridade é obrigatória.').bail().isIn(PRIORIDADES_VALIDAS).withMessage('Prioridade inválida.'),
  body('status').optional().isIn(STATUS_VALIDOS).withMessage('Status inválido.'),
  body('responsavel_id').optional({ nullable: true }).isInt().withMessage('Responsável inválido.'),
  body('incidente_id').optional({ nullable: true }).isInt().withMessage('Incidente inválido.'),
  body('data_pedido').optional({ nullable: true }).isISO8601().withMessage('Data do pedido inválida.'),
  body('data_contato').optional({ nullable: true }).isISO8601().withMessage('Data do contato inválida.'),
  body('prazo').optional({ nullable: true }).isISO8601().withMessage('Prazo inválido.'),
];

// PUT /api/casos/:id — mesmos campos, porém todos opcionais (atualização parcial)
const atualizarCasoValidator = [
  param('id').isInt().withMessage('Identificador do caso inválido.'),
  body('numero_pedido').optional().notEmpty().withMessage('O número do pedido não pode ficar vazio.'),
  body('cliente').optional().notEmpty().withMessage('O nome do cliente não pode ficar vazio.'),
  body('categoria_id').optional().isInt().withMessage('Categoria inválida.'),
  body('prioridade').optional().isIn(PRIORIDADES_VALIDAS).withMessage('Prioridade inválida.'),
  body('status').optional().isIn(STATUS_VALIDOS).withMessage('Status inválido.'),
  body('responsavel_id').optional({ nullable: true }).isInt().withMessage('Responsável inválido.'),
  body('incidente_id').optional({ nullable: true }).isInt().withMessage('Incidente inválido.'),
  body('data_pedido').optional({ nullable: true }).isISO8601().withMessage('Data do pedido inválida.'),
  body('data_contato').optional({ nullable: true }).isISO8601().withMessage('Data do contato inválida.'),
  body('prazo').optional({ nullable: true }).isISO8601().withMessage('Prazo inválido.'),
];

const idParamValidator = [param('id').isInt().withMessage('Identificador inválido.')];

module.exports = {
  criarCasoValidator,
  atualizarCasoValidator,
  idParamValidator,
  STATUS_VALIDOS,
  PRIORIDADES_VALIDAS,
};
