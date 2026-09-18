const { validationResult } = require('express-validator');
const { autenticarUsuario } = require('../services/authService');

// POST /api/auth/login
async function login(req, res, next) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({
      mensagem: 'Verifique os campos informados.',
      erros: erros.array().map((e) => e.msg),
    });
  }

  const { email, senha } = req.body;

  try {
    const resultado = await autenticarUsuario(email, senha);

    if (!resultado) {
      return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    }

    return res.status(200).json(resultado);
  } catch (err) {
    return next(err);
  }
}

// GET /api/auth/me — rota protegida, usada para validar se o token ainda é válido
async function me(req, res) {
  return res.status(200).json({ usuario: req.usuario });
}

module.exports = { login, me };
