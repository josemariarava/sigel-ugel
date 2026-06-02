import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '@fluentui/react-components'

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="large" />
                    <p className="text-sm text-gray-500 mt-3">Verificando sesión...</p>
                </div>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    return children
}

export default ProtectedRoute
