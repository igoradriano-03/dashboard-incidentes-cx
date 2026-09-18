import api from './api';

async function obterDashboard() {
  const { data } = await api.get('/dashboard');
  return data;
}

export default { obterDashboard };
