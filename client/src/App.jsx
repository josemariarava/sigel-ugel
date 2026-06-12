import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { FluentProvider, webLightTheme, Spinner } from '@fluentui/react-components'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/layout/Sidebar'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Bienes from './pages/Bienes'
import StockToners from './pages/StockToners'
import Personas from './pages/Personas'
import Asignaciones from './pages/Asignaciones'
import Bitacora from './pages/Bitacora'
import Ambientes from './pages/Ambientes'
import Configuracion from './pages/Configuracion'

function AppContent() {
    const { user, loading } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const activePage = location.pathname.replace('/', '') || 'dashboard'

    const handlePageChange = (page) => {
        navigate('/' + page)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="large" />
                    <p className="text-sm text-gray-500 mt-3">Cargando...</p>
                </div>
            </div>
        )
    }

    if (!user) return <Login />

    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar activePage={activePage} onPageChange={handlePageChange} />
            <Navbar />
            <main className="ml-72 pt-16">
                <div className="p-6">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/bienes" element={<ProtectedRoute><Bienes /></ProtectedRoute>} />
                        <Route path="/stock-toners" element={<ProtectedRoute><StockToners /></ProtectedRoute>} />
                        <Route path="/personas" element={<ProtectedRoute><Personas /></ProtectedRoute>} />
                        <Route path="/asignaciones" element={<ProtectedRoute><Asignaciones /></ProtectedRoute>} />
                        <Route path="/ambientes" element={<ProtectedRoute><Ambientes /></ProtectedRoute>} />
                        <Route path="/bitacora" element={<ProtectedRoute><Bitacora /></ProtectedRoute>} />
                        <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
                        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </div>
            </main>
        </div>
    )
}

function App() {
    return (
        <FluentProvider theme={webLightTheme}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </FluentProvider>
    )
}

export default App
