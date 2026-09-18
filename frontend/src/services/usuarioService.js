import api from './api';

async function listar() {
  const { data } = await api.get('/usuarios');
  return data;
}

export default { listar };
