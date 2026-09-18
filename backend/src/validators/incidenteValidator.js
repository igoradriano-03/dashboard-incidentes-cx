const { body, param } = require('express-validator');

const STATUS_VALIDOS = ['Aberto', 'Em acompanhamento', 'Resolvido', 'Encerrado'];
const PRIORIDADES_VALIDAS = ['Alta', 'Média', 'Baixa'];

// POST /api/incidentes — RN06, RN07: responsável e status obrigatórios.
// "codigo" NÃO é enviado pelo cliente: é gerado pelo backend (ver Seção 20,
// o formulário de novo incidente não pede código).
const criarIncidenteValidator = [
  body('nome').notEmpty().withMessage('O nome do incidente é obrigatório.'),
  body('descricao').optional({ nullable: true }).isString(),
  body('categoria_id').notEmpty().withMessage('A categoria é obrigatória.').bail().isInt().withMessage('Categoria inválida.'),
  body('prioridade').notEmpty().withMessage('A prioridade é obrigatória.').bail().isIn(PRIORIDADES_VALIDAS).withMessage('Prioridade inválida.'),
  body('status').optional().isIn(STATUS_VALIDOS).withMessage('Status inválido.'),
  body('responsavel_id').notEmpty().withMessage('O responsável é obrigatório.').bail().isInt().withMessage('Responsável inválido.'),
  body('data_abertura').optional({ nullable: true }).isISO8601().withMessage('Data de abertura inválida.'),
];

const atualizarIncidenteValidator = [
  param('id').isInt().withMessage('Identificador do incidente inválido.'),
  body('nome').optional().notEmpty().withMessage('O nome não pode ficar vazio.'),
  body('descricao').optional({ nullable: true }).isString(),
  body('categoria_id').optional().isInt().withMessage('Categoria inválida.'),
  body('prioridade').optional().isIn(PRIORIDADES_VALIDAS).withMessage('Prioridade inválida.'),
  body('status').optional().isIn(STATUS_VALIDOS).withMessage('Status inválido.'),
  body('responsavel_id').optional().isInt().withMessage('Responsável inválido.'),
  body('data_abertura').optional({ nullable: true }).isISO8601().withMessage('Data de abertura inválida.'),
  body('data_encerramento').optional({ nullable: true }).isISO8601().withMessage('Data de encerramento inválida.'),
];

const idParamValidator = [param('id').isInt().withMessage('Identificador inválido.')];

module.exports = {
  criarIncidenteValidator,
  atualizarIncidenteValidator,
  idParamValidator,
  STATUS_VALIDOS,
  PRIORIDADES_VALIDAS,
};
