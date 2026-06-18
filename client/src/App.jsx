import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { FluentProvider, webLightTheme, Spinner } from '@fluentui/react-components'
import { AuthProvider, useAuth } from './context/AuthContext'

const customTheme = {
    ...webLightTheme,
    fontFamilyBase: '"Outfit", "Segoe UI", sans-serif',
    fontFamilyMonospace: '"Outfit", "Segoe UI", monospace',
}
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

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
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}
            <Sidebar activePage={activePage} onPageChange={handlePageChange} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
            <Navbar collapsed={sidebarCollapsed} onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)} mobileOpen={mobileSidebarOpen} />
            <main className={`${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} ml-0 pt-16 transition-all duration-300`}>
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
        <FluentProvider theme={customTheme}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </FluentProvider>
    )
}

export default App
