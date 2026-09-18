import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import incidenteService from '../../services/incidenteService';
import categoriaService from '../../services/categoriaService';
import usuarioService from '../../services/usuarioService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { STATUS_INCIDENTE, PRIORIDADES } from '../../utils/constants';

const FORM_VAZIO = {
  nome: '', descricao: '', categoria_id: '', prioridade: '',
  status: 'Aberto', responsavel_id: '', data_abertura: '',
};

export default function IncidenteForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { mostrarToast } = useToast();

  const [form, setForm] = useState(FORM_VAZIO);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
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
      const [cats, users] = await Promise.all([categoriaService.listar(), usuarioService.listar()]);
      setCategorias(cats);
      setUsuarios(users);

      if (editando) {
        const incidente = await incidenteService.buscarPorId(id);
        setForm({
          nome: incidente.nome || '',
          descricao: incidente.descricao || '',
          categoria_id: incidente.categoria_id || '',
          prioridade: incidente.prioridade || '',
          status: incidente.status || 'Aberto',
          responsavel_id: incidente.responsavel_id || '',
          data_abertura: incidente.data_abertura ? incidente.data_abertura.slice(0, 10) : '',
        });
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
      if (payload.data_abertura === '') payload.data_abertura = null;

      if (editando) {
        await incidenteService.atualizar(id, payload);
        mostrarToast('Incidente atualizado com sucesso.');
        navigate(`/incidentes/${id}`);
      } else {
        const novoIncidente = await incidenteService.criar(payload);
        mostrarToast('Incidente criado com sucesso.');
        // Seção 20: "após criar, permitir adicionar casos relacionados" —
        // a própria tela de detalhes do incidente já tem esse atalho.
        navigate(`/incidentes/${novoIncidente.id}`);
      }
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Não foi possível cadastrar o incidente. Verifique os campos obrigatórios.');
      mostrarToast('Não foi possível salvar o incidente.', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando formulário..." />;

  return (
    <div className="pagina">
      <h2 className="pagina-titulo">{editando ? 'Editar incidente' : 'Novo incidente'}</h2>
      {erro && <div className="alerta-erro">{erro}</div>}

      <form className="formulario" onSubmit={handleSubmit}>
        <div className="formulario-grade">
          <label className="formulario-campo-largo">Nome *
            <input required value={form.nome} onChange={(e) => atualizarCampo('nome', e.target.value)} />
          </label>

          <label className="formulario-campo-largo">Descrição
            <textarea rows={3} value={form.descricao} onChange={(e) => atualizarCampo('descricao', e.target.value)} />
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
              {STATUS_INCIDENTE.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label>Responsável *
            <select required value={form.responsavel_id} onChange={(e) => atualizarCampo('responsavel_id', e.target.value)}>
              <option value="">Selecione...</option>
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </label>

          <label>Data de abertura
            <input type="date" value={form.data_abertura} onChange={(e) => atualizarCampo('data_abertura', e.target.value)} />
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
