export function formatarData(data) {
  if (!data) return '-';
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatarDataHora(data) {
  if (!data) return '-';
  return new Date(data).toLocaleString('pt-BR');
}

export const CORES_PRIORIDADE = {
  Alta: '#E5484D',
  Média: '#F5A524',
  Baixa: '#00C2FF',
};

export const CORES_STATUS_CASO = {
  Novo: '#5B8DEF',
  'Em tratativa': '#F5A524',
  'Aguardando transportadora': '#7A5AF8',
  'Aguardando cliente': '#0B2545',
  'Aguardando financeiro': '#B45309',
  Resolvido: '#12B76A',
  Cancelado: '#98A2B3',
};

export const CORES_STATUS_INCIDENTE = {
  Aberto: '#E5484D',
  'Em acompanhamento': '#F5A524',
  Resolvido: '#12B76A',
  Encerrado: '#98A2B3',
};

export const verificarStatusPrazo = (dataPrazo, statusCaso) => {
  // Casos já finalizados não entram no alerta de atraso
  if (statusCaso === 'Resolvido' || statusCaso === 'Cancelado') {
    return 'normal';
  }

  if (!dataPrazo) return 'normal';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const prazo = new Date(dataPrazo);
  prazo.setHours(0, 0, 0, 0);

  const diffTempo = prazo - hoje;
  const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return 'atrasado';     // Prazo estourado
  if (diffDias === 0) return 'vence-hoje'; // Vence hoje
  if (diffDias <= 2) return 'atencao';     // Falta pouco tempo

  return 'normal';
};