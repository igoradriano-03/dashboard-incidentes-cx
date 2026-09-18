import api from './api';

async function listar() {
  const { data } = await api.get('/categorias');
  return data;
}

export default { listar };
