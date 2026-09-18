import api from './api';

async function login(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha });
  localStorage.setItem('cx_token', data.token);
  localStorage.setItem('cx_usuario', JSON.stringify(data.usuario));
  return data.usuario;
}

function logout() {
  localStorage.removeItem('cx_token');
  localStorage.removeItem('cx_usuario');
}

function getUsuarioLogado() {
  const bruto = localStorage.getItem('cx_usuario');
  return bruto ? JSON.parse(bruto) : null;
}

export default { login, logout, getUsuarioLogado };
