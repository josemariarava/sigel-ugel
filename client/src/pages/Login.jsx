import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Button,
    Field,
    Input,
    Spinner,
    Tooltip
} from '@fluentui/react-components'
import {
    MailRegular,
    EyeRegular,
    EyeOffRegular,
    ShieldRegular,
    ArrowRightRegular,
    LockClosedRegular,
    BuildingRegular,
    PeopleRegular,
    HeadsetRegular
} from '@fluentui/react-icons'

const Login = () => {
    const { user, signIn } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [focusedField, setFocusedField] = useState(null)

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
        <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '30px 30px'
                    }}
                />
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`
                        }}
                    />
                ))}
            </div>

            <div className="relative flex flex-col md:flex-row w-full z-10">
                {/* LEFT PANEL — Enhanced Branding */}
                <div className="relative flex-1 md:w-[55%] min-h-[40vh] md:min-h-screen flex items-center justify-center overflow-hidden backdrop-blur-sm bg-black/20">
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-shimmer" />
                    </div>

                    <div className="relative z-10 text-center px-8 py-12">
                        {/* Logo */}
                        <div className="relative inline-block mx-auto mb-8">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-60 animate-pulse" />
                            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-1 rounded-full">
                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-full">
                                    <img
                                        src="/logo-ugel.png"
                                        alt="UGEL"
                                        className="w-28 h-28 md:w-36 md:h-36 drop-shadow-2xl transform transition-transform hover:scale-105 duration-300"
                                    />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                            SIGEL
                        </h1>
                        <p className="text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">
                            Sistema de Gestión UGEL
                        </p>
                        
                        <p className="text-blue-200/80 text-sm md:text-base mt-4 max-w-sm mx-auto leading-relaxed">
                            Tecnología al servicio de la educación
                        </p>

                        {/* Stats */}
                        <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm mx-auto">
                            {[
                                { value: 'Instituciones', label: 'Educativas', icon: <BuildingRegular /> },
                                { value: 'Docentes', label: 'y administrativos', icon: <PeopleRegular /> },
                                { value: 'Soporte', label: 'Técnico continuo', icon: <HeadsetRegular /> }
                            ].map((stat, idx) => (
                                <div key={idx} className="text-center">
                                    <div className="flex items-center justify-center text-blue-400 mb-2">
                                        {stat.icon}
                                    </div>
                                    <div className="text-white font-semibold text-sm">{stat.value}</div>
                                    <div className="text-blue-300/60 text-[11px]">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <p className="mt-12 text-blue-400/30 text-[10px] tracking-[0.2em] uppercase">
                            by <span className="text-blue-300/60 font-semibold">JoseMa DEV</span>
                        </p>
                    </div>
                </div>

                {/* RIGHT PANEL — Form */}
                <div className="flex-1 md:w-[45%] flex items-center justify-center p-6 md:p-10">
                    <div className="w-full max-w-md">
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                                    <LockClosedRegular className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Bienvenido</h2>
                                <p className="text-white/70 text-sm">Ingresa tus credenciales para acceder a SIGEL</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <Field 
                                    label={<span className="text-white/90 text-sm font-medium">Correo electrónico</span>} 
                                    required
                                >
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="correo@ugel.gob.pe"
                                        contentBefore={<MailRegular className="text-white/60" />}
                                        className="!bg-white/10 !border-white/20 focus:!border-blue-400 transition-all duration-300"
                                        input={{ style: { color: 'white', background: 'transparent', fontFamily: '"Outfit", sans-serif' } }}
                                        style={{
                                            boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none'
                                        }}
                                    />
                                </Field>

                                <Field 
                                    label={<span className="text-white/90 text-sm font-medium">Contraseña</span>} 
                                    required
                                >
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="••••••••"
                                        contentBefore={<ShieldRegular className="text-white/60" />}
                                        contentAfter={
                                            <Tooltip content={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} relationship="label">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="text-white/60 hover:text-white transition-colors cursor-pointer"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? <EyeOffRegular /> : <EyeRegular />}
                                                </button>
                                            </Tooltip>
                                        }
                                        className="!bg-white/10 !border-white/20 focus:!border-blue-400 transition-all duration-300"
                                        input={{ style: { color: 'white', background: 'transparent', fontFamily: '"Outfit", sans-serif' } }}
                                        style={{
                                            boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none'
                                        }}
                                    />
                                </Field>

                                {error && (
                                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3.5 backdrop-blur-sm animate-shake">
                                        <p className="text-sm text-red-200 text-center">{error}</p>
                                    </div>
                                )}

                                <Button
                                    appearance="primary"
                                    type="submit"
                                    disabled={loading}
                                    className="w-full !h-12 !text-sm !font-semibold !rounded-xl !bg-gradient-to-r !from-blue-600 !to-purple-600 !border-none hover:!shadow-lg hover:!shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02]"
                                    icon={loading ? <Spinner size="tiny" /> : <ArrowRightRegular />}
                                    iconPosition="after"
                                >
                                    {loading ? 'Verificando acceso...' : 'Acceder al sistema'}
                                </Button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-white/10 text-center">
                                <p className="text-xs text-white/30">
                                    SIGEL © {new Date().getFullYear()} — Desarrollado por <span className="text-white/50 font-medium">JoseMa DEV</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login