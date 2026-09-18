import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import casoService from '../../services/casoService';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErroMensagem from '../../components/ErroMensagem';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { TIPOS_INTERACAO } from '../../utils/constants';
import { CORES_STATUS_CASO, CORES_PRIORIDADE, formatarData, formatarDataHora } from '../../utils/formatters';

export default function CasoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mostrarToast } = useToast();

  const [caso, setCaso] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [novaInteracao, setNovaInteracao] = useState({ tipo: 'Atendimento inicial', descricao: '' });
  const [enviandoInteracao, setEnviandoInteracao] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => { carregar(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const dados = await casoService.buscarPorId(id);
      setCaso(dados);
    } catch (err) {
      setErro('Não foi possível carregar o caso.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleAdicionarInteracao(e) {
    e.preventDefault();
    if (!novaInteracao.descricao.trim()) return;
    setEnviandoInteracao(true);
    setErro('');
    try {
      await casoService.criarInteracao(id, novaInteracao);
      setNovaInteracao({ tipo: 'Atendimento inicial', descricao: '' });
      mostrarToast('Interação registrada com sucesso.');
      await carregar();
    } catch (err) {
      setErro('Não foi possível registrar a interação.');
      mostrarToast('Não foi possível registrar a interação.', 'erro');
    } finally {
      setEnviandoInteracao(false);
    }
  }

  async function handleExcluir() {
    try {
      await casoService.remover(id);
      mostrarToast('Caso excluído com sucesso.');
      navigate('/casos');
    } catch (err) {
      setErro('Não foi possível excluir o caso.');
      mostrarToast('Não foi possível excluir o caso.', 'erro');
      setConfirmandoExclusao(false);
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando caso..." />;
  if (erro && !caso) return <ErroMensagem mensagem={erro} onTentarNovamente={carregar} />;
  if (!caso) return null;

  return (
    <div className="pagina">
      <div className="pagina-cabecalho">
        <h2 className="pagina-titulo">Caso #{caso.id} — {caso.numero_pedido}</h2>
        <div className="pagina-acoes">
          <Link to={`/casos/${id}/editar`} className="botao-secundario">Editar</Link>
          <button className="botao-perigo" onClick={() => setConfirmandoExclusao(true)}>Excluir</button>
        </div>
      </div>

      {erro && <div className="alerta-erro">{erro}</div>}

      <div className="detalhes-grade">
        <section className="detalhes-secao">
          <h3>Informações principais</h3>
          <dl className="lista-definicao">
            <dt>Cliente</dt><dd>{caso.cliente}</dd>
            <dt>Categoria</dt><dd>{caso.categoria_nome || '-'}</dd>
            <dt>Status</dt><dd><Badge texto={caso.status} cor={CORES_STATUS_CASO[caso.status]} /></dd>
            <dt>Prioridade</dt><dd><Badge texto={caso.prioridade} cor={CORES_PRIORIDADE[caso.prioridade]} /></dd>
            <dt>Responsável</dt><dd>{caso.responsavel_nome || '-'}</dd>
          </dl>
        </section>

        <section className="detalhes-secao">
          <h3>Tratamento</h3>
          <dl className="lista-definicao">
            <dt>Última ação</dt><dd>{caso.ultima_acao || '-'}</dd>
            <dt>Próxima ação</dt><dd>{caso.proxima_acao || '-'}</dd>
            <dt>Prazo</dt><dd>{formatarData(caso.prazo)}</dd>
          </dl>
        </section>

        <section className="detalhes-secao">
          <h3>Incidente</h3>
          {caso.incidente_id ? (
            <Link to={`/incidentes/${caso.incidente_id}`} className="link-destaque">
              {caso.incidente_codigo} — {caso.incidente_nome}
            </Link>
          ) : (
            <p className="texto-suave">Nenhum incidente relacionado.</p>
          )}
        </section>
      </div>

      <section className="detalhes-secao">
        <h3>Interações</h3>
        <ul className="timeline">
          {caso.interacoes.length === 0 && (
            <li className="texto-suave">Nenhuma interação registrada ainda.</li>
          )}
          {caso.interacoes.map((i) => (
            <li key={i.id} className="timeline-item">
              <div className="timeline-cabecalho">
                <Badge texto={i.tipo} cor="#0B2545" />
                <span className="timeline-data">{formatarDataHora(i.criado_em)} — {i.usuario_nome}</span>
              </div>
              <p>{i.descricao}</p>
            </li>
          ))}
        </ul>

        <form className="formulario-interacao" onSubmit={handleAdicionarInteracao}>
          <select
            value={novaInteracao.tipo}
            onChange={(e) => setNovaInteracao((n) => ({ ...n, tipo: e.target.value }))}
          >
            {TIPOS_INTERACAO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            placeholder="Descreva a interação..."
            value={novaInteracao.descricao}
            onChange={(e) => setNovaInteracao((n) => ({ ...n, descricao: e.target.value }))}
          />
          <button type="submit" className="botao-primario" disabled={enviandoInteracao}>
            {enviandoInteracao ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
      </section>

      {confirmandoExclusao && (
        <ConfirmDialog
          titulo="Excluir caso"
          mensagem={`Tem certeza que deseja excluir o caso #${caso.id}? Essa ação não pode ser desfeita.`}
          onConfirmar={handleExcluir}
          onCancelar={() => setConfirmandoExclusao(false)}
        />
      )}
    </div>
  );
}
