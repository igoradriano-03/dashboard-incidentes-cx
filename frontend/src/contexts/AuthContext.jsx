import { createContext, useState } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => authService.getUsuarioLogado());
  const [carregando, setCarregando] = useState(false);

  async function entrar(email, senha) {
    setCarregando(true);
    try {
      const usuarioLogado = await authService.login(email, senha);
      setUsuario(usuarioLogado);
      return usuarioLogado;
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    authService.logout();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}
