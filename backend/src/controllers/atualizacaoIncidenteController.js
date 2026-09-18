const { validationResult } = require('express-validator');
const atualizacaoService = require('../services/atualizacaoIncidenteService');

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

// GET /api/incidentes/:id/atualizacoes
async function listar(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const incidenteId = req.params.id;
    if (!(await atualizacaoService.incidenteExiste(incidenteId))) {
      return res.status(404).json({ mensagem: 'Incidente não encontrado.' });
    }
    const atualizacoes = await atualizacaoService.listarAtualizacoesPorIncidente(incidenteId);
    return res.status(200).json(atualizacoes);
  } catch (err) {
    return next(err);
  }
}

// POST /api/incidentes/:id/atualizacoes
async function criar(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const incidenteId = req.params.id;
    if (!(await atualizacaoService.incidenteExiste(incidenteId))) {
      return res.status(404).json({ mensagem: 'Incidente não encontrado.' });
    }
    const novaAtualizacao = await atualizacaoService.criarAtualizacao(
      incidenteId,
      req.usuario.id,
      req.body.descricao
    );
    return res.status(201).json(novaAtualizacao);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, criar };
