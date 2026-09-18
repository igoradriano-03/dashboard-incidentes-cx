import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './layouts/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CasosList from './pages/Casos/CasosList';
import CasoForm from './pages/Casos/CasoForm';
import CasoDetalhes from './pages/Casos/CasoDetalhes';
import IncidentesList from './pages/Incidentes/IncidentesList';
import IncidenteForm from './pages/Incidentes/IncidenteForm';
import IncidenteDetalhes from './pages/Incidentes/IncidenteDetalhes';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/casos" element={<CasosList />} />
                <Route path="/casos/novo" element={<CasoForm />} />
                <Route path="/casos/:id/editar" element={<CasoForm />} />
                <Route path="/casos/:id" element={<CasoDetalhes />} />

                <Route path="/incidentes" element={<IncidentesList />} />
                <Route path="/incidentes/novo" element={<IncidenteForm />} />
                <Route path="/incidentes/:id/editar" element={<IncidenteForm />} />
                <Route path="/incidentes/:id" element={<IncidenteDetalhes />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
