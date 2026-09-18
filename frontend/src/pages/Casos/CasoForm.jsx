import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import casoService from '../../services/casoService';
import categoriaService from '../../services/categoriaService';
import usuarioService from '../../services/usuarioService';
import incidenteService from '../../services/incidenteService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { STATUS_CASO, PRIORIDADES } from '../../utils/constants';

const FORM_VAZIO = {
  numero_pedido: '', cliente: '', data_pedido: '', data_contato: '',
  categoria_id: '', prioridade: '', status: 'Novo', responsavel_id: '',
  incidente_id: '', link_atendimento: '', ultima_acao: '', proxima_acao: '',
  prazo: '', observacoes: '',
};

export default function CasoForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { mostrarToast } = useToast();

  const [form, setForm] = useState(FORM_VAZIO);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function carregarDados() {
    setCarregando(true);
    setErro('');
    try {
      const [cats, users, incs] = await Promise.all([
        categoriaService.listar(),
        usuarioService.listar(),
        incidenteService.listar({ limite: 100 }),
      ]);
      setCategorias(cats);
      setUsuarios(users);
      setIncidentes(incs.dados);

      if (editando) {
        const caso = await casoService.buscarPorId(id);
        setForm({
          numero_pedido: caso.numero_pedido || '',
          cliente: caso.cliente || '',
          data_pedido: caso.data_pedido ? caso.data_pedido.slice(0, 10) : '',
          data_contato: caso.data_contato ? caso.data_contato.slice(0, 10) : '',
          categoria_id: caso.categoria_id || '',
          prioridade: caso.prioridade || '',
          status: caso.status || 'Novo',
          responsavel_id: caso.responsavel_id || '',
          incidente_id: caso.incidente_id || '',
          link_atendimento: caso.link_atendimento || '',
          ultima_acao: caso.ultima_acao || '',
          proxima_acao: caso.proxima_acao || '',
          prazo: caso.prazo ? caso.prazo.slice(0, 10) : '',
          observacoes: caso.observacoes || '',
        });
      } else {
        // Permite chegar aqui a partir da tela de Detalhes do Incidente
        // já com o incidente pré-selecionado (Seção 20: "após criar,
        // permitir adicionar casos relacionados").
        const incidentePreSelecionado = searchParams.get('incidente_id');
        if (incidentePreSelecionado) {
          setForm((f) => ({ ...f, incidente_id: incidentePreSelecionado }));
        }
      }
    } catch (err) {
      setErro('Não foi possível carregar os dados do formulário.');
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const payload = { ...form };
      // Campos opcionais vazios viram null (evita mandar string vazia para
      // colunas de data/inteiro no backend).
      ['data_pedido', 'data_contato', 'responsavel_id', 'incidente_id', 'prazo'].forEach((campo) => {
        if (payload[campo] === '') payload[campo] = null;
      });

      if (editando) {
        await casoService.atualizar(id, payload);
        mostrarToast('Caso atualizado com sucesso.');
        navigate(`/casos/${id}`);
      } else {
        const novoCaso = await casoService.criar(payload);
        mostrarToast('Caso criado com sucesso.');
        navigate(`/casos/${novoCaso.id}`);
      }
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Não foi possível cadastrar o caso. Verifique os campos obrigatórios.');
      mostrarToast('Não foi possível salvar o caso.', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando formulário..." />;

  return (
    <div className="pagina">
      <h2 className="pagina-titulo">{editando ? 'Editar caso' : 'Novo caso'}</h2>
      {erro && <div className="alerta-erro">{erro}</div>}

      <form className="formulario" onSubmit={handleSubmit}>
        <div className="formulario-grade">
          <label>Número do pedido *
            <input required value={form.numero_pedido} onChange={(e) => atualizarCampo('numero_pedido', e.target.value)} />
          </label>

          <label>Cliente *
            <input required value={form.cliente} onChange={(e) => atualizarCampo('cliente', e.target.value)} />
          </label>

          <label>Data do pedido
            <input type="date" value={form.data_pedido} onChange={(e) => atualizarCampo('data_pedido', e.target.value)} />
          </label>

          <label>Data do contato
            <input type="date" value={form.data_contato} onChange={(e) => atualizarCampo('data_contato', e.target.value)} />
          </label>

          <label>Categoria *
            <select required value={form.categoria_id} onChange={(e) => atualizarCampo('categoria_id', e.target.value)}>
              <option value="">Selecione...</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>

          <label>Prioridade *
            <select required value={form.prioridade} onChange={(e) => atualizarCampo('prioridade', e.target.value)}>
              <option value="">Selecione...</option>
              {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>

          <label>Status
            <select value={form.status} onChange={(e) => atualizarCampo('status', e.target.value)}>
              {STATUS_CASO.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label>Responsável
            <select value={form.responsavel_id} onChange={(e) => atualizarCampo('responsavel_id', e.target.value)}>
              <option value="">Nenhum</option>
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </label>

          <label>Incidente
            <select value={form.incidente_id} onChange={(e) => atualizarCampo('incidente_id', e.target.value)}>
              <option value="">Nenhum</option>
              {incidentes.map((i) => <option key={i.id} value={i.id}>{i.codigo} — {i.nome}</option>)}
            </select>
          </label>

          <label>Prazo
            <input type="date" value={form.prazo} onChange={(e) => atualizarCampo('prazo', e.target.value)} />
          </label>

          <label className="formulario-campo-largo">Link do atendimento
            <input value={form.link_atendimento} onChange={(e) => atualizarCampo('link_atendimento', e.target.value)} />
          </label>

          <label className="formulario-campo-largo">Última ação
            <textarea rows={2} value={form.ultima_acao} onChange={(e) => atualizarCampo('ultima_acao', e.target.value)} />
          </label>

          <label className="formulario-campo-largo">Próxima ação
            <textarea rows={2} value={form.proxima_acao} onChange={(e) => atualizarCampo('proxima_acao', e.target.value)} />
          </label>

          <label className="formulario-campo-largo">Observações
            <textarea rows={3} value={form.observacoes} onChange={(e) => atualizarCampo('observacoes', e.target.value)} />
          </label>
        </div>

        <div className="formulario-acoes">
          <button type="button" className="botao-secundario" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="botao-primario" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
