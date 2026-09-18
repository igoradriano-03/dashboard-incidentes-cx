import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import incidenteService from '../../services/incidenteService';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErroMensagem from '../../components/ErroMensagem';
import Paginacao from '../../components/Paginacao';
import { STATUS_INCIDENTE, PRIORIDADES } from '../../utils/constants';
import { CORES_STATUS_INCIDENTE, CORES_PRIORIDADE, formatarData, formatarDataHora } from '../../utils/formatters';

export default function IncidentesList() {
  const [resultado, setResultado] = useState({ dados: [], total: 0, pagina: 1, totalPaginas: 1 });
  const [filtros, setFiltros] = useState({ busca: '', status: '', prioridade: '', pagina: 1 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
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
      const dados = await incidenteService.listar(params);
      setResultado(dados);
    } catch (err) {
      setErro('Não foi possível carregar os incidentes. Tente novamente.');
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
        <h2 className="pagina-titulo">Incidentes</h2>
        <Link to="/incidentes/novo" className="botao-primario">+ Novo incidente</Link>
      </div>

      <div className="barra-filtros">
        <input
          type="text"
          placeholder="Buscar por nome ou código..."
          value={filtros.busca}
          onChange={(e) => atualizarFiltro('busca', e.target.value)}
        />
        <select value={filtros.status} onChange={(e) => atualizarFiltro('status', e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_INCIDENTE.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtros.prioridade} onChange={(e) => atualizarFiltro('prioridade', e.target.value)}>
          <option value="">Todas as prioridades</option>
          {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {carregando && <LoadingSpinner texto="Carregando incidentes..." />}
      {!carregando && erro && <ErroMensagem mensagem={erro} onTentarNovamente={carregar} />}

      {!carregando && !erro && (
        <>
          <div className="tabela-wrapper">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Código</th><th>Nome</th><th>Categoria</th><th>Casos</th>
                  <th>Responsável</th><th>Status</th><th>Prioridade</th>
                  <th>Data de abertura</th><th>Última atualização</th>
                </tr>
              </thead>
              <tbody>
                {resultado.dados.length === 0 && (
                  <tr>
                    <td colSpan={9} className="tabela-vazia">
                      <span className="tabela-vazia-icone">🚨</span>
                      Nenhum incidente encontrado com esses filtros.
                    </td>
                  </tr>
                )}
                {resultado.dados.map((i) => (
                  <tr
                    key={i.id}
                    className="tabela-linha-clicavel"
                    onClick={() => navigate(`/incidentes/${i.id}`)}
                  >
                    <td>{i.codigo}</td>
                    <td>{i.nome}</td>
                    <td>{i.categoria_nome || '-'}</td>
                    <td>{i.total_casos}</td>
                    <td>{i.responsavel_nome || '-'}</td>
                    <td><Badge texto={i.status} cor={CORES_STATUS_INCIDENTE[i.status]} /></td>
                    <td><Badge texto={i.prioridade} cor={CORES_PRIORIDADE[i.prioridade]} /></td>
                    <td>{formatarData(i.data_abertura)}</td>
                    <td>{formatarDataHora(i.atualizado_em)}</td>
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
