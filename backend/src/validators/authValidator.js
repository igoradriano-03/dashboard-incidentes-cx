const { body } = require('express-validator');

// RN implícita das telas: e-mail e senha são obrigatórios para login (Seção 15).
const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Informe um e-mail válido.'),
  body('senha')
    .notEmpty()
    .withMessage('A senha é obrigatória.'),
];

module.exports = { loginValidator };
