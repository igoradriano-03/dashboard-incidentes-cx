import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import casoService from '../../services/casoService';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErroMensagem from '../../components/ErroMensagem';
import Paginacao from '../../components/Paginacao';
import { STATUS_CASO, PRIORIDADES } from '../../utils/constants';
import { CORES_STATUS_CASO, CORES_PRIORIDADE, formatarData, verificarStatusPrazo } from '../../utils/formatters';

export default function CasosList() {
 const [resultado, setResultado] = useState({ dados: [], total: 0, pagina: 1, totalPaginas: 1 });

  const casosAtrasados = (resultado.dados || []).filter(
    (caso) => verificarStatusPrazo(caso.prazo, caso.status) === 'atrasado'
  ).length;

  const [filtros, setFiltros] = useState({ busca: '', status: '', prioridade: '', pagina: 1 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // pequeno debounce para não disparar uma requisição a cada tecla digitada na busca
    const temporizador = setTimeout(() => { carregar(); }, 300);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const params = { ...filtros };
      Object.keys(params).forEach((chave) => { if (!params[chave]) delete params[chave]; });
      const dados = await casoService.listar(params);
      setResultado(dados);
    } catch (err) {
      setErro('Não foi possível carregar os casos. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  function atualizarFiltro(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor, pagina: campo === 'pagina' ? valor : 1 }));
  }

  return (
    <div className="pagina">
      <div className="pagina-cabecalho">
        <h2 className="pagina-titulo">Casos</h2>
        <Link to="/casos/novo" className="botao-primario">+ Novo caso</Link>
      </div>

      {casosAtrasados > 0 && (
        <div className="alerta-banner-atraso">
          🚨 <strong>Atenção operacional:</strong> Você possui <strong>{casosAtrasados}</strong> caso(s) com prazo estourado!
        </div>
      )}

      
      <div className="barra-filtros">
        <input
          type="text"
          placeholder="Buscar por cliente ou nº do pedido..."
          value={filtros.busca}
          onChange={(e) => atualizarFiltro('busca', e.target.value)}
        />
        <select value={filtros.status} onChange={(e) => atualizarFiltro('status', e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_CASO.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtros.prioridade} onChange={(e) => atualizarFiltro('prioridade', e.target.value)}>
          <option value="">Todas as prioridades</option>
          {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {carregando && <LoadingSpinner texto="Carregando casos..." />}
      {!carregando && erro && <ErroMensagem mensagem={erro} onTentarNovamente={carregar} />}

      {!carregando && !erro && (
        <>
          <div className="tabela-wrapper">
            <table className="tabela">
              <thead>
                <tr>
                  <th>ID</th><th>Pedido</th><th>Cliente</th><th>Categoria</th>
                  <th>Status</th><th>Prioridade</th><th>Responsável</th>
                  <th>Incidente</th><th>Data</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultado.dados.length === 0 && (
                  <tr>
                    <td colSpan={10} className="tabela-vazia">
                      <span className="tabela-vazia-icone">🗂️</span>
                      Nenhum caso encontrado com esses filtros.
                    </td>
                  </tr>
                )}
                {resultado.dados.map((c) => (
                  <tr
                    key={c.id}
                    className="tabela-linha-clicavel"
                    onClick={() => navigate(`/casos/${c.id}`)}
                  >
                    <td>{c.id}</td>
                    <td>{c.numero_pedido}</td>
                    <td>{c.cliente}</td>
                    <td>{c.categoria_nome || '-'}</td>
                    <td><Badge texto={c.status} cor={CORES_STATUS_CASO[c.status]} /></td>
                    <td><Badge texto={c.prioridade} cor={CORES_PRIORIDADE[c.prioridade]} /></td>
                    <td>{c.responsavel_nome || '-'}</td>
                    <td>{c.incidente_codigo || '-'}</td>
                    <td>{formatarData(c.criado_em)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Link to={`/casos/${c.id}/editar`} className="link-acao">Editar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacao
            pagina={resultado.pagina}
            totalPaginas={resultado.totalPaginas}
            total={resultado.total}
            onMudarPagina={(p) => atualizarFiltro('pagina', p)}
          />
        </>
      )}
    </div>
  );
}
