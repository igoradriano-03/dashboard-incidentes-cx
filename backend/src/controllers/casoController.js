const { validationResult } = require('express-validator');
const casoService = require('../services/casoService');

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

// GET /api/casos?status=&prioridade=&categoria_id=&incidente_id=&responsavel_id=&busca=&ordenarPor=&ordem=&pagina=&limite=
async function listar(req, res, next) {
  try {
    const resultado = await casoService.listarCasos(req.query);
    return res.status(200).json(resultado);
  } catch (err) {
    return next(err);
  }
}

// GET /api/casos/:id
async function buscarPorId(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const caso = await casoService.buscarCasoPorId(req.params.id);
    if (!caso) {
      return res.status(404).json({ mensagem: 'Caso não encontrado.' });
    }
    return res.status(200).json(caso);
  } catch (err) {
    return next(err);
  }
}

// POST /api/casos
async function criar(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const novoCaso = await casoService.criarCaso(req.body);
    return res.status(201).json(novoCaso);
  } catch (err) {
    return next(err);
  }
}

// PUT /api/casos/:id
async function atualizar(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const casoAtualizado = await casoService.atualizarCaso(req.params.id, req.body);
    if (!casoAtualizado) {
      return res.status(404).json({ mensagem: 'Caso não encontrado.' });
    }
    return res.status(200).json(casoAtualizado);
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/casos/:id
async function remover(req, res, next) {
  if (tratarErrosValidacao(req, res)) return;
  try {
    const removido = await casoService.removerCaso(req.params.id);
    if (!removido) {
      return res.status(404).json({ mensagem: 'Caso não encontrado.' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
