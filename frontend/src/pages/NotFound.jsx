import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="pagina-nao-encontrada">
      <h1>404</h1>
      <p>Página não encontrada.</p>
      <Link to="/dashboard" className="botao-primario">Voltar ao Dashboard</Link>
    </div>
  );
}
