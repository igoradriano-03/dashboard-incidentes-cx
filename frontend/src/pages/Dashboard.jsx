import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import dashboardService from '../services/dashboardService';
import incidenteService from '../services/incidenteService';
import CardIndicador from '../components/CardIndicador';
import LoadingSpinner from '../components/LoadingSpinner';
import ErroMensagem from '../components/ErroMensagem';
import Badge from '../components/Badge';
import { CORES_STATUS_INCIDENTE, CORES_PRIORIDADE, formatarDataHora } from '../utils/formatters';

const PALETA_GRAFICOS = ['#00C2FF', '#0B2545', '#13315C', '#5B8DEF', '#7A5AF8', '#F5A524', '#12B76A'];

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [incidentesAtivos, setIncidentesAtivos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const [dashboard, incidentes] = await Promise.all([
        dashboardService.obterDashboard(),
        // A API filtra por um único status por vez, então buscamos uma página
        // maior e filtramos no cliente os que estão "ativos" (Aberto ou Em
        // acompanhamento) para montar a tabela da Seção 15.
        incidenteService.listar({ limite: 50, ordenarPor: 'atualizado_em', ordem: 'desc' }),
      ]);
      setDados(dashboard);
      setIncidentesAtivos(
        incidentes.dados.filter((i) => ['Aberto', 'Em acompanhamento'].includes(i.status)).slice(0, 6)
      );
    } catch (err) {
      setErro('Não foi possível carregar o dashboard. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando indicadores..." />;
  if (erro) return <ErroMensagem mensagem={erro} onTentarNovamente={carregar} />;

  const { indicadores, graficos } = dados;

  const cardsPrincipais = [
    { titulo: 'Total de Incidentes', valor: indicadores.total_incidentes },
    { titulo: 'Casos em Tratativa', valor: indicadores.casos_em_tratativa },
    { titulo: 'Aguardando Transportadora', valor: indicadores.aguardando_transportadora },
    { titulo: 'Aguardando Cliente', valor: indicadores.aguardando_cliente },
    { titulo: 'Resolvidos', valor: indicadores.resolvidos },
    { titulo: 'Casos Críticos', valor: indicadores.casos_criticos, destaque: true },
  ];

  const cardsSecundarios = [
    { titulo: 'Clientes Afetados', valor: indicadores.clientes_afetados },
    { titulo: 'Recontatos', valor: indicadores.recontatos },
    { titulo: 'Incidentes Ativos', valor: indicadores.incidentes_ativos },
  ];

  return (
    <div className="pagina">
      <h2 className="pagina-titulo">Dashboard</h2>

      <div className="grade-cards">
        {cardsPrincipais.map((c) => <CardIndicador key={c.titulo} {...c} />)}
      </div>
      <div className="grade-cards grade-cards-secundaria">
        {cardsSecundarios.map((c) => <CardIndicador key={c.titulo} {...c} />)}
      </div>

   {/* SEÇÃO DE GRÁFICOS */}
      <div className="graficos-grid">

        {/* 1. Casos por Categoria */}
        <div className="grafico-card">
          <h3>Casos por categoria</h3>
          <div className="chart-wrapper">
            <Bar
              data={{
                labels: graficos.casos_por_categoria.map((i) => i.categoria),
                datasets: [{
                  label: 'Casos',
                  data: graficos.casos_por_categoria.map((i) => i.total),
                  backgroundColor: '#00C2FF',
                  borderRadius: 4,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>
        </div>

        {/* 2. Casos por Status */}
        <div className="grafico-card">
          <h3>Casos por status</h3>
          <div className="chart-wrapper">
            <Doughnut
              data={{
                labels: graficos.casos_por_status.map((i) => i.status),
                datasets: [{
                  data: graficos.casos_por_status.map((i) => i.total),
                  backgroundColor: PALETA_GRAFICOS,
                  borderWidth: 0,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
              }}
            />
          </div>
        </div>

        {/* 3. Incidentes por Prioridade */}
        <div className="grafico-card">
          <h3>Incidentes por prioridade</h3>
          <div className="chart-wrapper">
            <Bar
              data={{
                labels: graficos.incidentes_por_prioridade.map((i) => i.prioridade),
                datasets: [{
                  label: 'Incidentes',
                  data: graficos.incidentes_por_prioridade.map((i) => i.total),
                  backgroundColor: ['#E54D4D', '#FA9A24', '#00C2FF'],
                  borderRadius: 4,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>
        </div>

        {/* 4. Evolução de Casos (Ocupa a largura inteira) */}
        <div className="grafico-card">
          <h3>Evolução de casos por período</h3>
          <div className="chart-wrapper">
            <Line
              data={{
                labels: graficos.evolucao_casos.map((i) => i.periodo),
                datasets: [{
                  label: 'Casos criados',
                  data: graficos.evolucao_casos.map((i) => i.total),
                  borderColor: '#00C2FF',
                  backgroundColor: '#00C2FF33',
                  tension: 0.35,
                  fill: true,
                }],
              }}
            />
          </div>
        </div>

      </div>

      <section className="detalhes-secao">
        <div className="pagina-cabecalho">
          <h3>Incidentes em acompanhamento</h3>
          <Link to="/incidentes" className="link-destaque">Ver todos</Link>
        </div>
        <div className="tabela-wrapper">
          <table className="tabela">
            <thead>
              <tr>
                <th>Incidente</th><th>Casos</th><th>Responsável</th>
                <th>Status</th><th>Última atualização</th><th>Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {incidentesAtivos.length === 0 && (
                <tr><td colSpan={6} className="tabela-vazia">Nenhum incidente ativo no momento.</td></tr>
              )}
              {incidentesAtivos.map((i) => (
                <tr key={i.id}>
                  <td><Link to={`/incidentes/${i.id}`} className="link-destaque">{i.codigo} — {i.nome}</Link></td>
                  <td>{i.total_casos}</td>
                  <td>{i.responsavel_nome || '-'}</td>
                  <td><Badge texto={i.status} cor={CORES_STATUS_INCIDENTE[i.status]} /></td>
                  <td>{formatarDataHora(i.atualizado_em)}</td>
                  <td><Badge texto={i.prioridade} cor={CORES_PRIORIDADE[i.prioridade]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
