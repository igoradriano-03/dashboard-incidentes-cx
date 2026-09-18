import api from './api';

async function listar(params = {}) {
  const { data } = await api.get('/casos', { params });
  return data;
}

async function buscarPorId(id) {
  const { data } = await api.get(`/casos/${id}`);
  return data;
}

async function criar(dados) {
  const { data } = await api.post('/casos', dados);
  return data;
}

async function atualizar(id, dados) {
  const { data } = await api.put(`/casos/${id}`, dados);
  return data;
}

async function remover(id) {
  await api.delete(`/casos/${id}`);
}

async function criarInteracao(casoId, dados) {
  const { data } = await api.post(`/casos/${casoId}/interacoes`, dados);
  return data;
}

export default { listar, buscarPorId, criar, atualizar, remover, criarInteracao };
