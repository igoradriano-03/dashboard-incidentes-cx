const { validationResult } = require('express-validator');
const interacaoService = require('../services/interacaoService');

function tratarErrosValidacao(req, res) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    res.status(400).json({
      mensagem: 'Verifique os campos informados.',
      erros: erros.array().map((e) => e.msg),
    });
    return true;
  }
  return false;
}

// GET /api/casos/:id/interacoes
async function listar(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const casoId = req.params.id;
    if (!(await interacaoService.casoExiste(casoId))) {
      return res.status(404).json({ mensagem: 'Caso não encontrado.' });
    }
    const interacoes = await interacaoService.listarInteracoesPorCaso(casoId);
    return res.status(200).json(interacoes);
  } catch (err) {
    return next(err);
  }
}

// POST /api/casos/:id/interacoes
async function criar(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const casoId = req.params.id;
    if (!(await interacaoService.casoExiste(casoId))) {
      return res.status(404).json({ mensagem: 'Caso não encontrado.' });
    }
    // req.usuario vem do middleware de autenticação (payload do JWT)
    const novaInteracao = await interacaoService.criarInteracao(casoId, req.usuario.id, req.body);
    return res.status(201).json(novaInteracao);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, criar };
