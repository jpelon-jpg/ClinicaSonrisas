import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, inicioPorRol, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { Cargando } from './components/Estados'

import Login from './pages/auth/Login'
import Registro from './pages/auth/Registro'
import OlvidePassword from './pages/auth/OlvidePassword'
import Restablecer from './pages/auth/Restablecer'
import Perfil from './pages/comun/Perfil'
import { NoEncontrado, Prohibido } from './pages/comun/Errores'
import Privacidad from './pages/comun/Privacidad'

import AdminInicio from './pages/admin/AdminInicio'
import Usuarios from './pages/admin/Usuarios'
import Roles from './pages/admin/Roles'
import Tratamientos from './pages/admin/Tratamientos'
import Notificaciones from './pages/admin/Notificaciones'

import RecepcionInicio from './pages/recepcion/RecepcionInicio'
import Citas from './pages/recepcion/Citas'
import Solicitudes from './pages/recepcion/Solicitudes'
import Pacientes from './pages/recepcion/Pacientes'
import Dentistas from './pages/recepcion/Dentistas'

import Agenda from './pages/dentista/Agenda'
import MisPacientes from './pages/dentista/MisPacientes'
import Expediente from './pages/dentista/Expediente'

import PacienteInicio from './pages/paciente/PacienteInicio'
import AgendarCita from './pages/paciente/AgendarCita'
import MisCitas from './pages/paciente/MisCitas'

function Inicio() {
  const { usuario, cargando } = useAuth()
  if (cargando) return <div className="pantalla-centro"><Cargando /></div>
  return <Navigate to={usuario ? inicioPorRol(usuario) : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/olvide-password" element={<OlvidePassword />} />
            <Route path="/restablecer" element={<Restablecer />} />
            <Route path="/403" element={<Prohibido />} />
            <Route path="/privacidad" element={<Privacidad />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/perfil" element={<Perfil />} />

                <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                  <Route path="/admin" element={<AdminInicio />} />
                  <Route path="/admin/usuarios" element={<Usuarios />} />
                  <Route path="/admin/roles" element={<Roles />} />
                  <Route path="/admin/tratamientos" element={<Tratamientos />} />
                  <Route path="/admin/notificaciones" element={<Notificaciones />} />
                  <Route path="/admin/expediente/:pacienteId" element={<Expediente />} />
                </Route>

                <Route element={<ProtectedRoute roles={['ADMIN', 'RECEPCIONISTA']} />}>
                  <Route path="/recepcion" element={<RecepcionInicio />} />
                  <Route path="/recepcion/citas" element={<Citas />} />
                  <Route path="/recepcion/solicitudes" element={<Solicitudes />} />
                  <Route path="/recepcion/pacientes" element={<Pacientes />} />
                  <Route path="/recepcion/dentistas" element={<Dentistas />} />
                </Route>

                <Route element={<ProtectedRoute roles={['DENTISTA']} />}>
                  <Route path="/dentista" element={<Agenda />} />
                  <Route path="/dentista/pacientes" element={<MisPacientes />} />
                  <Route path="/dentista/expediente/:pacienteId" element={<Expediente />} />
                </Route>

                <Route element={<ProtectedRoute roles={['PACIENTE']} />}>
                  <Route path="/paciente" element={<PacienteInicio />} />
                  <Route path="/paciente/agendar" element={<AgendarCita />} />
                  <Route path="/paciente/citas" element={<MisCitas />} />
                  <Route path="/paciente/expediente" element={<Expediente propio />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NoEncontrado />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
