const { validationResult } = require('express-validator');
const incidenteService = require('../services/incidenteService');

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

// GET /api/incidentes?status=&prioridade=&categoria_id=&responsavel_id=&busca=&ordenarPor=&ordem=&pagina=&limite=
async function listar(req, res, next) {
  try {
    const resultado = await incidenteService.listarIncidentes(req.query);
    return res.status(200).json(resultado);
  } catch (err) {
    return next(err);
  }
}

// GET /api/incidentes/:id — inclui indicadores, casos relacionados e timeline (Seção 21)
async function buscarPorId(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const incidente = await incidenteService.buscarIncidentePorId(req.params.id);
    if (!incidente) {
      return res.status(404).json({ mensagem: 'Incidente não encontrado.' });
    }
    return res.status(200).json(incidente);
  } catch (err) {
    return next(err);
  }
}

// POST /api/incidentes
async function criar(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const novoIncidente = await incidenteService.criarIncidente(req.body);
    return res.status(201).json(novoIncidente);
  } catch (err) {
    return next(err);
  }
}

// PUT /api/incidentes/:id
async function atualizar(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const incidenteAtualizado = await incidenteService.atualizarIncidente(req.params.id, req.body);
    if (!incidenteAtualizado) {
      return res.status(404).json({ mensagem: 'Incidente não encontrado.' });
    }
    return res.status(200).json(incidenteAtualizado);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, buscarPorId, criar, atualizar };
