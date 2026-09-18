import api from './api';

async function listar(params = {}) {
  const { data } = await api.get('/incidentes', { params });
  return data;
}

async function buscarPorId(id) {
  const { data } = await api.get(`/incidentes/${id}`);
  return data;
}

async function criar(dados) {
  const { data } = await api.post('/incidentes', dados);
  return data;
}

async function atualizar(id, dados) {
  const { data } = await api.put(`/incidentes/${id}`, dados);
  return data;
}

async function criarAtualizacao(incidenteId, descricao) {
  const { data } = await api.post(`/incidentes/${incidenteId}/atualizacoes`, { descricao });
  return data;
}

export default { listar, buscarPorId, criar, atualizar, criarAtualizacao };
