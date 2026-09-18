const { body, param } = require('express-validator');

const TIPOS_VALIDOS = [
  'Atendimento inicial', 'Recontato', 'E-mail',
  'WhatsApp', 'Ligação', 'Interno', 'Outro',
];

// GET /api/casos/:id/interacoes
const listarInteracoesValidator = [
  param('id').isInt().withMessage('Identificador do caso inválido.'),
];

// POST /api/casos/:id/interacoes
// usuario_id NÃO vem do corpo da requisição: é sempre o usuário autenticado
// (req.usuario.id, extraído do token JWT), para não permitir que alguém
// registre uma interação em nome de outra pessoa.
const criarInteracaoValidator = [
  param('id').isInt().withMessage('Identificador do caso inválido.'),
  body('tipo')
    .notEmpty().withMessage('O tipo de interação é obrigatório.')
    .bail()
    .isIn(TIPOS_VALIDOS).withMessage('Tipo de interação inválido.'),
  body('descricao').notEmpty().withMessage('A descrição da interação é obrigatória.'),
];

module.exports = { listarInteracoesValidator, criarInteracaoValidator, TIPOS_VALIDOS };
