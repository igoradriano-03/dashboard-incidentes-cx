import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ITENS = [
  { path: '/dashboard', label: 'Dashboard', icone: '📊' },
  { path: '/casos', label: 'Casos', icone: '🗂️' },
  { path: '/incidentes', label: 'Incidentes', icone: '🚨' },
];

export default function Sidebar() {
  const { usuario, sair } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-topo">
        <span className="sidebar-logo">Dashboard de Gestão de Incidentes em CX</span>
      </div>

      <nav className="sidebar-nav">
        {ITENS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link-ativo' : ''}`}
          >
            <span className="sidebar-icone">{item.icone}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-rodape">
        <div className="sidebar-usuario">
          <span className="sidebar-usuario-nome">{usuario?.nome}</span>
          <span className="sidebar-usuario-perfil">{usuario?.perfil}</span>
        </div>
        <button className="sidebar-sair" onClick={sair}>Sair</button>
      </div>
    </aside>
  );
}
