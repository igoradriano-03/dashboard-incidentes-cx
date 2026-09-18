import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import incidenteService from '../../services/incidenteService';
import Badge from '../../components/Badge';
import CardIndicador from '../../components/CardIndicador';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErroMensagem from '../../components/ErroMensagem';
import { useToast } from '../../hooks/useToast';
import { STATUS_INCIDENTE } from '../../utils/constants';
import { CORES_STATUS_CASO, CORES_PRIORIDADE, CORES_STATUS_INCIDENTE, formatarData, formatarDataHora } from '../../utils/formatters';

export default function IncidenteDetalhes() {
  const { id } = useParams();
  const { mostrarToast } = useToast();

  const [incidente, setIncidente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [novaAtualizacao, setNovaAtualizacao] = useState('');
  const [enviandoAtualizacao, setEnviandoAtualizacao] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  useEffect(() => { carregar(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const dados = await incidenteService.buscarPorId(id);
      setIncidente(dados);
    } catch (err) {
      setErro('Não foi possível carregar o incidente.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleAdicionarAtualizacao(e) {
    e.preventDefault();
    if (!novaAtualizacao.trim()) return;
    setEnviandoAtualizacao(true);
    setErro('');
    try {
      await incidenteService.criarAtualizacao(id, novaAtualizacao);
      setNovaAtualizacao('');
      mostrarToast('Atualização registrada com sucesso.');
      await carregar();
    } catch (err) {
      setErro('Não foi possível registrar a atualização.');
      mostrarToast('Não foi possível registrar a atualização.', 'erro');
    } finally {
      setEnviandoAtualizacao(false);
    }
  }

  async function handleMudarStatus(novoStatus) {
    setAlterandoStatus(true);
    setErro('');
    try {
      await incidenteService.atualizar(id, { status: novoStatus });
      mostrarToast(`Status alterado para "${novoStatus}".`);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Não foi possível alterar o status do incidente.');
      mostrarToast('Não foi possível alterar o status do incidente.', 'erro');
    } finally {
      setAlterandoStatus(false);
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando incidente..." />;
  if (erro && !incidente) return <ErroMensagem mensagem={erro} onTentarNovamente={carregar} />;
  if (!incidente) return null;

  return (
    <div className="pagina">
      <div className="pagina-cabecalho">
        <div>
          <h2 className="pagina-titulo">{incidente.codigo} — {incidente.nome}</h2>
          <div className="pagina-subtitulo">
            <Badge texto={incidente.status} cor={CORES_STATUS_INCIDENTE[incidente.status]} />
            <Badge texto={incidente.prioridade} cor={CORES_PRIORIDADE[incidente.prioridade]} />
            <span className="texto-suave">Responsável: {incidente.responsavel_nome || '-'}</span>
          </div>
        </div>
        <div className="pagina-acoes">
          <select
            value={incidente.status}
            disabled={alterandoStatus}
            onChange={(e) => handleMudarStatus(e.target.value)}
          >
            {STATUS_INCIDENTE.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Link to={`/casos/novo?incidente_id=${incidente.id}`} className="botao-primario">+ Adicionar caso</Link>
        </div>
      </div>

      {erro && <div className="alerta-erro">{erro}</div>}

      <div className="grade-cards">
        <CardIndicador titulo="Total de Casos" valor={incidente.indicadores.total_casos} />
        <CardIndicador titulo="Casos Resolvidos" valor={incidente.indicadores.casos_resolvidos} />
        <CardIndicador titulo="Casos em Tratamento" valor={incidente.indicadores.casos_em_tratamento} />
        <CardIndicador titulo="Clientes Afetados" valor={incidente.indicadores.clientes_afetados} />
      </div>

      <div className="detalhes-grade">
        <section className="detalhes-secao">
          <h3>Informações</h3>
          <dl className="lista-definicao">
            <dt>Descrição</dt><dd>{incidente.descricao || '-'}</dd>
            <dt>Categoria</dt><dd>{incidente.categoria_nome || '-'}</dd>
            <dt>Data de abertura</dt><dd>{formatarData(incidente.data_abertura)}</dd>
            <dt>Data de encerramento</dt><dd>{formatarData(incidente.data_encerramento)}</dd>
            <dt>Última atualização</dt><dd>{formatarDataHora(incidente.atualizado_em)}</dd>
          </dl>
        </section>
      </div>

      <section className="detalhes-secao">
        <h3>Casos relacionados</h3>
        <div className="tabela-wrapper">
          <table className="tabela">
            <thead>
              <tr><th>ID</th><th>Pedido</th><th>Cliente</th><th>Status</th><th>Prioridade</th></tr>
            </thead>
            <tbody>
              {incidente.casos.length === 0 && (
                <tr><td colSpan={5} className="tabela-vazia">Nenhum caso vinculado a este incidente ainda.</td></tr>
              )}
              {incidente.casos.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/casos/${c.id}`} className="link-destaque">#{c.id}</Link></td>
                  <td>{c.numero_pedido}</td>
                  <td>{c.cliente}</td>
                  <td><Badge texto={c.status} cor={CORES_STATUS_CASO[c.status]} /></td>
                  <td><Badge texto={c.prioridade} cor={CORES_PRIORIDADE[c.prioridade]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detalhes-secao">
        <h3>Timeline</h3>
        <ul className="timeline">
          {incidente.timeline.length === 0 && (
            <li className="texto-suave">Nenhuma atualização registrada ainda.</li>
          )}
          {incidente.timeline.map((a) => (
            <li key={a.id} className="timeline-item">
              <div className="timeline-cabecalho">
                <span className="timeline-data">{formatarDataHora(a.criado_em)} — {a.usuario_nome}</span>
              </div>
              <p>{a.descricao}</p>
            </li>
          ))}
        </ul>

        <form className="formulario-interacao" onSubmit={handleAdicionarAtualizacao}>
          <input
            placeholder="Descreva a nova atualização..."
            value={novaAtualizacao}
            onChange={(e) => setNovaAtualizacao(e.target.value)}
          />
          <button type="submit" className="botao-primario" disabled={enviandoAtualizacao}>
            {enviandoAtualizacao ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
      </section>
    </div>
  );
}
