import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Button,
    Field,
    Input,
    Card,
    Spinner
} from '@fluentui/react-components'
import { LockClosedRegular } from '@fluentui/react-icons'

const Login = () => {
    const { user, signIn } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (user) navigate('/dashboard', { replace: true })
    }, [user, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email || !password) return
        setLoading(true)
        setError('')
        try {
            await signIn(email, password)
        } catch (err) {
            setError(err.message === 'Invalid login credentials'
                ? 'Correo o contraseña incorrectos'
                : err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm !p-8">
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <LockClosedRegular className="text-blue-600 text-2xl" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Iniciar Sesión</h1>
                    <p className="text-sm text-gray-500 mt-1">Ingrese sus credenciales</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Correo electrónico" required>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                        />
                    </Field>

                    <Field label="Contraseña" required>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </Field>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <Button
                        appearance="primary"
                        type="submit"
                        disabled={loading}
                        className="w-full"
                        icon={loading ? <Spinner size="tiny" /> : undefined}
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </Button>
                </form>
            </Card>
        </div>
    )
}

export default Login
