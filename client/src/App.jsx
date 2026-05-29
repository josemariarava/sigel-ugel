import { Routes, Route, Navigate } from 'react-router-dom'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import Sidebar from './components/layout/Sidebar'
import Navbar from './components/layout/Navbar'
import Dashboard from './pages/Dashboard'
import Bienes from './pages/Bienes'
import StockToners from './pages/StockToners'
import Personas from './pages/Personas'
import Asignaciones from './pages/Asignaciones'
import Ambientes from './pages/Ambientes'
import Configuracion from './pages/Configuracion'

function App() {
    return (
        <FluentProvider theme={webLightTheme}>
            <div className="min-h-screen bg-gray-100">
                <Sidebar />
                <Navbar />
                <main className="ml-64 pt-16">
                    <div className="p-6">
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/bienes" element={<Bienes />} />
                            <Route path="/stock-toners" element={<StockToners />} />
                            <Route path="/personas" element={<Personas />} />
                            <Route path="/asignaciones" element={<Asignaciones />} />
                            <Route path="/ambientes" element={<Ambientes />} />
                            <Route path="/configuracion" element={<Configuracion />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </FluentProvider>
    )
}

export default App