const { body, param } = require('express-validator');

// GET /api/incidentes/:id/atualizacoes
const listarAtualizacoesValidator = [
  param('id').isInt().withMessage('Identificador do incidente inválido.'),
];

// POST /api/incidentes/:id/atualizacoes
// Assim como em interações, usuario_id vem do token (req.usuario.id), não do corpo.
const criarAtualizacaoValidator = [
  param('id').isInt().withMessage('Identificador do incidente inválido.'),
  body('descricao').notEmpty().withMessage('A descrição da atualização é obrigatória.'),
];

module.exports = { listarAtualizacoesValidator, criarAtualizacaoValidator };
