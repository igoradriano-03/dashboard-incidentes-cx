import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const { entrar, carregando } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    try {
      await entrar(email, senha);
      navigate('/dashboard');
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Não foi possível entrar. Verifique suas credenciais.');
    }
  }

  return (
    <div className="pagina-login">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-titulo">Gestão de Incidentes CX</h1>
        <p className="login-subtitulo">Sistema de Gestão de Incidentes e Inteligência Operacional</p>

        {erro && <div className="alerta-erro">{erro}</div>}

        <label className="login-campo">
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="login-campo">
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit" className="botao-primario login-botao" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
