import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'
import { useAuth } from '../context/AuthContext'
import {
    AddRegular,
    EditRegular,
    DeleteRegular,
    DismissRegular,
    ArrowSyncRegular,
    BuildingRegular,
    PersonCircleRegular,
    LockClosedRegular,
    WarningFilled,
    SearchRegular,
    BoxRegular,
    CartRegular,
    DesktopRegular,
    TagRegular
} from '@fluentui/react-icons'
import {
    Button,
    Input,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Card,
    Field,
    useToastController,
    Toast,
    ToastTitle,
    ToastBody,
    Toaster,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle,
    Dialog,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions,
    Badge,
    Tooltip,
    Subtitle2,
    TabList,
    Tab,
    Spinner,
    Avatar,
    SearchBox
} from '@fluentui/react-components'
import ConfirmDialog from '../components/shared/ConfirmDialog'

const Configuracion = () => {
    const [marcas, setMarcas] = useState([])
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [bloqueoInfo, setBloqueoInfo] = useState(null)
    const [modelos, setModelos] = useState([])
    const [selectedMarca, setSelectedMarca] = useState(null)
    const [loading, setLoading] = useState(true)
    const [openMarcaDrawer, setOpenMarcaDrawer] = useState(false)
    const [openModeloDrawer, setOpenModeloDrawer] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [marcaForm, setMarcaForm] = useState({ nombre: '' })
    const [modeloForm, setModeloForm] = useState({ marca_id: '', nombre: '' })

    const { dispatchToast } = useToastController()
    const { user } = useAuth()

    const [selectedTab, setSelectedTab] = useState('catalogo')
    const [profileForm, setProfileForm] = useState({ nombre: '' })
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
    const [savingProfile, setSavingProfile] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)

    const [marcaSearch, setMarcaSearch] = useState('')
    const [modeloSearch, setModeloSearch] = useState('')
    const [savingMarca, setSavingMarca] = useState(false)
    const [savingModelo, setSavingModelo] = useState(false)

    const BRAND_COLORS = {
        HP: '#0071CE',
        BROTHER: '#009E3D',
        XEROX: '#C8102E',
        EPSON: '#003399',
        SAMSUNG: '#1428A0',
        CANON: '#CC0000',
        PANASONIC: '#0066CC',
        LENOVO: '#E31C1C',
        DELL: '#007DB8',
        ACER: '#83B81A',
        ASUS: '#333333',
        HUAWEI: '#CF0A2C',
        TOSHIBA: '#CC0000',
        OKI: '#006F3C',
        KYOCERA: '#D71921',
        RICOH: '#000000',
        SHARP: '#262262',
        SONY: '#000000',
        LG: '#A50034',
        MICROSOFT: '#737373',
        APPLE: '#555555'
    }

    const getBrandColor = (nombre) => {
        const key = nombre?.toUpperCase() || ''
        if (BRAND_COLORS[key]) return BRAND_COLORS[key]
        const hue = [...key].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
        return `hsl(${hue}, 55%, 55%)`
    }

    const marcasFiltradas = marcas.filter(m =>
        m.nombre.toLowerCase().includes(marcaSearch.toLowerCase())
    )

    const modelosFiltrados = modelos.filter(m =>
        m.nombre.toLowerCase().includes(modeloSearch.toLowerCase())
    )

    useEffect(() => {
        if (user?.user_metadata?.nombre) {
            setProfileForm({ nombre: user.user_metadata.nombre })
        }
    }, [user])

    const mostrarToast = (mensaje, tipo = 'success') => {
        dispatchToast(
            <Toast>
                <ToastTitle>{tipo === 'success' ? '✅ Éxito' : '❌ Error'}</ToastTitle>
                <ToastBody>{mensaje}</ToastBody>
            </Toast>,
            { intent: tipo }
        )
    }

    const cargarMarcas = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('marcas')
                .select('*')
                .order('nombre')
            if (error) throw error
            setMarcas(data || [])
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar marcas'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const cargarModelos = async (marcaId) => {
        try {
            const { data, error } = await supabase
                .from('modelos')
                .select('*')
                .eq('marca_id', marcaId)
                .order('nombre')
            if (error) throw error
            setModelos(data || [])
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar modelos'), 'error')
        }
    }

    useEffect(() => {
        cargarMarcas()
    }, [])

    const cargarDatosPorDefecto = async () => {
        const marcasPorDefecto = [
            {
                nombre: 'HP',
                modelos: ['CF283A', 'CF226X', 'CF280X', 'CE285A', 'CF410X', 'CF500X', 'CF510X', 'W1330A']
            },
            {
                nombre: 'Brother',
                modelos: ['TN3479', 'TN3428', 'TN2270', 'TN730', 'TN760', 'TN850', 'TN2430']
            },
            {
                nombre: 'Xerox',
                modelos: ['006R01731', '006R01772', '006R01773', '006R01272', '006R03412']
            },
            {
                nombre: 'Epson',
                modelos: ['T129', 'T544', 'T664', 'T673', 'T674']
            },
            {
                nombre: 'Samsung',
                modelos: ['MLT-D101S', 'MLT-D111S', 'MLT-D205L']
            },
            {
                nombre: 'Canon',
                modelos: ['045H', '054H', '057H', '067H']
            },
            {
                nombre: 'Panasonic',
                modelos: ['KX-FAD', 'KX-FAC', 'KX-FAT']
            }
        ]

        try {
            for (const m of marcasPorDefecto) {
                const { data: marca, error: errM } = await supabase
                    .from('marcas')
                    .insert({ nombre: m.nombre })
                    .select()
                    .single()

                if (errM) {
                    if (errM.code === '23505') continue // duplicado
                    throw errM
                }

                if (marca && m.modelos.length > 0) {
                    const modelosData = m.modelos.map(nom => ({
                        marca_id: marca.id,
                        nombre: nom
                    }))
                    const { error: errMod } = await supabase
                        .from('modelos')
                        .insert(modelosData)
                    if (errMod && errMod.code !== '23505') throw errMod
                }
            }

            mostrarToast('Datos por defecto cargados correctamente')
            cargarMarcas()
            if (selectedMarca) {
                cargarModelos(selectedMarca.id)
            }
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar datos por defecto'), 'error')
        }
    }

    // PERFIL
    const guardarPerfil = async () => {
        if (!profileForm.nombre.trim()) {
            mostrarToast('El nombre es obligatorio', 'error')
            return
        }
        try {
            setSavingProfile(true)
            const { error } = await supabase.auth.updateUser({
                data: { nombre: profileForm.nombre.trim() }
            })
            if (error) throw error
            mostrarToast('Perfil actualizado correctamente')
        } catch (error) {
            mostrarToast(handleApiError(error, 'actualizar perfil'), 'error')
        } finally {
            setSavingProfile(false)
        }
    }

    const cambiarPassword = async () => {
        if (!passwordForm.newPassword) {
            mostrarToast('La nueva contraseña es obligatoria', 'error')
            return
        }
        if (passwordForm.newPassword.length < 6) {
            mostrarToast('La contraseña debe tener al menos 6 caracteres', 'error')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            mostrarToast('Las contraseñas no coinciden', 'error')
            return
        }
        try {
            setSavingPassword(true)
            const { error } = await supabase.auth.updateUser({
                password: passwordForm.newPassword
            })
            if (error) throw error
            mostrarToast('Contraseña actualizada correctamente')
            setPasswordForm({ newPassword: '', confirmPassword: '' })
        } catch (error) {
            mostrarToast(handleApiError(error, 'cambiar contraseña'), 'error')
        } finally {
            setSavingPassword(false)
        }
    }

    const seleccionarMarca = (marca) => {
        setSelectedMarca(marca)
        cargarModelos(marca.id)
    }

    // CRUD MARCAS
    const abrirNuevaMarca = () => {
        setEditMode(false)
        setMarcaForm({ nombre: '' })
        setOpenMarcaDrawer(true)
    }

    const abrirEditarMarca = (marca) => {
        setEditMode(true)
        setMarcaForm({ nombre: marca.nombre, id: marca.id })
        setOpenMarcaDrawer(true)
    }

    const guardarMarca = async () => {
        if (!marcaForm.nombre.trim()) {
            mostrarToast('El nombre de la marca es obligatorio', 'error')
            return
        }
        try {
            setSavingMarca(true)
            if (editMode) {
                const { error } = await supabase
                    .from('marcas')
                    .update({ nombre: marcaForm.nombre.trim() })
                    .eq('id', marcaForm.id)
                if (error) throw error
                mostrarToast('Marca actualizada correctamente')
            } else {
                const { error } = await supabase
                    .from('marcas')
                    .insert({ nombre: marcaForm.nombre.trim() })
                if (error) {
                    if (error.code === '23505') {
                        mostrarToast('Ya existe una marca con ese nombre', 'error')
                        return
                    }
                    throw error
                }
                mostrarToast('Marca creada correctamente')
            }
            setOpenMarcaDrawer(false)
            cargarMarcas()
        } catch (error) {
            mostrarToast(handleApiError(error, 'guardar marca'), 'error')
        } finally {
            setSavingMarca(false)
        }
    }

    const eliminarMarca = (id, nombre) => {
        setDeleteTarget({ type: 'marca', id, nombre })
    }

    const confirmEliminarMarca = async () => {
        if (!deleteTarget) return
        try {
            const [bienesRes, comprasRes, equiposRes] = await Promise.all([
                supabase.from('bienes').select('id, tipo_equipo, marca, modelo, serie, estado').eq('marca_id', deleteTarget.id),
                supabase.from('compra_detalles').select('id, marca, modelo, cantidad_pedida').eq('marca_id', deleteTarget.id),
                supabase.from('compras_equipos_detalles').select('id, marca, modelo, cantidad_recibida').eq('marca_id', deleteTarget.id)
            ])

            const items = [
                ...(bienesRes.data || []).map(b => ({
                    tipo: b.tipo_equipo,
                    descripcion: [b.marca, b.modelo].filter(Boolean).join(' ') || '—',
                    serie: b.serie || '—',
                    estado: b.estado || '—'
                })),
                ...(comprasRes.data || []).map(c => ({
                    tipo: 'Compra Tóner',
                    descripcion: [c.marca, c.modelo].filter(Boolean).join(' ') || '—',
                    serie: `${c.cantidad_pedida} unidad(es)`,
                    estado: '—'
                })),
                ...(equiposRes.data || []).map(e => ({
                    tipo: 'Compra Equipo',
                    descripcion: [e.marca, e.modelo].filter(Boolean).join(' ') || '—',
                    serie: `${e.cantidad_recibida} unidad(es)`,
                    estado: '—'
                }))
            ]

            if (items.length > 0) {
                setBloqueoInfo({ tipo: 'marca', nombre: deleteTarget.nombre, items })
                setDeleteTarget(null)
                return
            }

            const { error } = await supabase
                .from('marcas')
                .delete()
                .eq('id', deleteTarget.id)
            if (error) throw error
            mostrarToast('Marca eliminada correctamente')
            if (selectedMarca?.id === deleteTarget.id) {
                setSelectedMarca(null)
                setModelos([])
            }
            cargarMarcas()
        } catch (error) {
            mostrarToast(handleApiError(error, 'eliminar marca'), 'error')
        } finally {
            setDeleteTarget(null)
        }
    }

    // CRUD MODELOS
    const abrirNuevoModelo = () => {
        if (!selectedMarca) {
            mostrarToast('Selecciona una marca primero', 'error')
            return
        }
        setEditMode(false)
        setModeloForm({ nombre: '', marca_id: selectedMarca.id })
        setOpenModeloDrawer(true)
    }

    const abrirEditarModelo = (modelo) => {
        setEditMode(true)
        setModeloForm({ nombre: modelo.nombre, id: modelo.id, marca_id: modelo.marca_id })
        setOpenModeloDrawer(true)
    }

    const guardarModelo = async () => {
        if (!modeloForm.nombre.trim()) {
            mostrarToast('El nombre del modelo es obligatorio', 'error')
            return
        }
        try {
            setSavingModelo(true)
            if (editMode) {
                const { error } = await supabase
                    .from('modelos')
                    .update({ nombre: modeloForm.nombre.trim() })
                    .eq('id', modeloForm.id)
                if (error) throw error
                mostrarToast('Modelo actualizado correctamente')
            } else {
                const { error } = await supabase
                    .from('modelos')
                    .insert({ nombre: modeloForm.nombre.trim(), marca_id: modeloForm.marca_id })
                if (error) {
                    if (error.code === '23505') {
                        mostrarToast('Ya existe un modelo con ese nombre en esta marca', 'error')
                        return
                    }
                    throw error
                }
                mostrarToast('Modelo creado correctamente')
            }
            setOpenModeloDrawer(false)
            cargarModelos(selectedMarca.id)
        } catch (error) {
            mostrarToast(handleApiError(error, 'guardar modelo'), 'error')
        } finally {
            setSavingModelo(false)
        }
    }

    const eliminarModelo = (id, nombre) => {
        setDeleteTarget({ type: 'modelo', id, nombre })
    }

    const confirmEliminarModelo = async () => {
        if (!deleteTarget) return
        try {
            const [bienesRes, comprasRes, equiposRes] = await Promise.all([
                supabase.from('bienes').select('id, tipo_equipo, marca, modelo, serie, estado').eq('modelo_id', deleteTarget.id),
                supabase.from('compra_detalles').select('id, marca, modelo, cantidad_pedida').eq('modelo_id', deleteTarget.id),
                supabase.from('compras_equipos_detalles').select('id, marca, modelo, cantidad_recibida').eq('modelo_id', deleteTarget.id)
            ])

            const items = [
                ...(bienesRes.data || []).map(b => ({
                    tipo: b.tipo_equipo,
                    descripcion: [b.marca, b.modelo].filter(Boolean).join(' ') || '—',
                    serie: b.serie || '—',
                    estado: b.estado || '—'
                })),
                ...(comprasRes.data || []).map(c => ({
                    tipo: 'Compra Tóner',
                    descripcion: [c.marca, c.modelo].filter(Boolean).join(' ') || '—',
                    serie: `${c.cantidad_pedida} unidad(es)`,
                    estado: '—'
                })),
                ...(equiposRes.data || []).map(e => ({
                    tipo: 'Compra Equipo',
                    descripcion: [e.marca, e.modelo].filter(Boolean).join(' ') || '—',
                    serie: `${e.cantidad_recibida} unidad(es)`,
                    estado: '—'
                }))
            ]

            if (items.length > 0) {
                setBloqueoInfo({ tipo: 'modelo', nombre: deleteTarget.nombre, items })
                setDeleteTarget(null)
                return
            }

            const { error } = await supabase
                .from('modelos')
                .delete()
                .eq('id', deleteTarget.id)
            if (error) throw error
            mostrarToast('Modelo eliminado correctamente')
            cargarModelos(selectedMarca.id)
        } catch (error) {
            mostrarToast(handleApiError(error, 'eliminar modelo'), 'error')
        } finally {
            setDeleteTarget(null)
        }
    }

    return (
        <div className="p-1 space-y-6">
            <Toaster />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Catálogo de marcas y modelos, perfil de usuario</p>
                </div>
            </div>

            <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value)}>
                <Tab value="catalogo">Catálogo</Tab>
                <Tab value="perfil">Mi Perfil</Tab>
            </TabList>

            {selectedTab === 'catalogo' ? (
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Panel izquierdo: Marcas */}
                    <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BuildingRegular className="text-blue-600 text-lg" />
                                <Subtitle2>Marcas</Subtitle2>
                                <Badge appearance="filled" color="brand" size="small">{marcas.length}</Badge>
                            </div>
                            <div className="flex gap-2">
                                <Tooltip content="Cargar marcas y modelos por defecto" relationship="label">
                                    <Button
                                        appearance="subtle"
                                        icon={<ArrowSyncRegular />}
                                        onClick={cargarDatosPorDefecto}
                                        size="small"
                                    />
                                </Tooltip>
                                <Button
                                    appearance="primary"
                                    icon={<AddRegular />}
                                    onClick={abrirNuevaMarca}
                                    size="small"
                                >
                                    Nueva Marca
                                </Button>
                            </div>
                        </div>

                        <SearchBox
                            placeholder="Buscar marcas..."
                            value={marcaSearch}
                            onChange={(_, d) => setMarcaSearch(d.value)}
                            size="small"
                            className="w-full"
                        />

                        <Card className="!p-0 overflow-hidden flex-1">
                            {loading ? (
                                <div className="flex items-center justify-center h-32 text-gray-500">
                                    <Spinner size="tiny" />
                                    <span className="ml-2 text-sm">Cargando...</span>
                                </div>
                            ) : marcasFiltradas.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                    <BuildingRegular className="mb-2" style={{ fontSize: 36 }} />
                                    <p className="text-sm font-medium">
                                        {marcaSearch ? 'Sin resultados' : 'No hay marcas registradas'}
                                    </p>
                                    <p className="text-xs mt-1">
                                        {marcaSearch ? 'Prueba con otro término' : 'Crea una o carga datos por defecto'}
                                    </p>
                                    {!marcaSearch && (
                                        <Button appearance="subtle" icon={<AddRegular />} onClick={abrirNuevaMarca} size="small" className="mt-3">
                                            Crear primera marca
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
                                    {marcasFiltradas.map(marca => (
                                        <div
                                            key={marca.id}
                                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-200 hover:bg-blue-50/50 ${
                                                selectedMarca?.id === marca.id
                                                    ? 'bg-blue-50 border-l-[3px] border-l-blue-500 shadow-sm'
                                                    : 'border-l-[3px] border-l-transparent'
                                            }`}
                                            onClick={() => seleccionarMarca(marca)}
                                        >
                                            <Avatar
                                                name={marca.nombre}
                                                initials={marca.nombre.charAt(0).toUpperCase()}
                                                style={{ backgroundColor: getBrandColor(marca.nombre), color: '#fff' }}
                                                size={32}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{marca.nombre}</p>
                                            </div>
                                            <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <Tooltip content="Editar marca" relationship="label">
                                                    <Button appearance="subtle" icon={<EditRegular />} onClick={() => abrirEditarMarca(marca)} size="small" />
                                                </Tooltip>
                                                <Tooltip content="Eliminar marca" relationship="label">
                                                    <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => eliminarMarca(marca.id, marca.nombre)} size="small" />
                                                </Tooltip>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Panel derecho: Modelos */}
                    <div className={`w-full lg:w-1/2 xl:w-3/5 transition-all duration-300 flex flex-col gap-3 ${selectedMarca ? 'opacity-100' : 'lg:opacity-40'}`}>
                        {selectedMarca ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            name={selectedMarca.nombre}
                                            initials={selectedMarca.nombre.charAt(0).toUpperCase()}
                                            style={{ backgroundColor: getBrandColor(selectedMarca.nombre), color: '#fff' }}
                                            size={24}
                                        />
                                        <Subtitle2>
                                            Modelos de <span className="text-blue-600">{selectedMarca.nombre}</span>
                                        </Subtitle2>
                                        <Badge appearance="filled" color="brand" size="small">{modelos.length}</Badge>
                                    </div>
                                    <Button appearance="primary" icon={<AddRegular />} onClick={abrirNuevoModelo} size="small">
                                        Nuevo Modelo
                                    </Button>
                                </div>

                                <SearchBox
                                    placeholder="Buscar modelos..."
                                    value={modeloSearch}
                                    onChange={(_, d) => setModeloSearch(d.value)}
                                    size="small"
                                    className="w-full"
                                />

                                {modelosFiltrados.length === 0 ? (
                                    <Card className="!p-0 overflow-hidden">
                                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                            <p className="text-sm font-medium">
                                                {modeloSearch ? 'Sin resultados' : 'No hay modelos para esta marca'}
                                            </p>
                                            <p className="text-xs mt-1">
                                                {modeloSearch ? 'Prueba con otro término' : 'Agrega el primer modelo'}
                                            </p>
                                            {!modeloSearch && (
                                                <Button appearance="subtle" icon={<AddRegular />} onClick={abrirNuevoModelo} size="small" className="mt-3">
                                                    Crear primer modelo
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                ) : (
                                    <Card className="!p-0 overflow-hidden flex-1">
                                        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 p-3 max-h-[500px] overflow-y-auto">
                                            {modelosFiltrados.map(modelo => (
                                                <div
                                                    key={modelo.id}
                                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all bg-white group"
                                                >
                                                    <span className="text-sm font-mono text-gray-700 truncate">{modelo.nombre}</span>
                                                    <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Tooltip content="Editar modelo" relationship="label">
                                                            <Button appearance="subtle" icon={<EditRegular />} onClick={() => abrirEditarModelo(modelo)} size="small" />
                                                        </Tooltip>
                                                        <Tooltip content="Eliminar modelo" relationship="label">
                                                            <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => eliminarModelo(modelo.id, modelo.nombre)} size="small" />
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <Card className="!p-0 overflow-hidden flex-1">
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <BuildingRegular className="mb-3" style={{ fontSize: 40 }} />
                                    <p className="text-sm font-medium">Selecciona una marca</p>
                                    <p className="text-xs mt-1">Para ver y gestionar sus modelos</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Perfil */}
                    <Card className="!p-0 overflow-hidden">
                        <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                            <PersonCircleRegular className="text-blue-600" />
                            <Subtitle2>Información del perfil</Subtitle2>
                        </div>
                        <div className="p-6 space-y-4">
                            <Field label="Correo electrónico">
                                <Input value={user?.email || ''} disabled />
                            </Field>
                            <Field label="Nombre completo">
                                <Input
                                    value={profileForm.nombre}
                                    onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                                    placeholder="Tu nombre completo"
                                />
                            </Field>
                            <div className="flex justify-end">
                                <Button
                                    appearance="primary"
                                    icon={<PersonCircleRegular />}
                                    onClick={guardarPerfil}
                                    disabled={savingProfile}
                                >
                                    {savingProfile ? <Spinner size="tiny" /> : 'Guardar cambios'}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Seguridad */}
                    <Card className="!p-0 overflow-hidden">
                        <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                            <LockClosedRegular className="text-blue-600" />
                            <Subtitle2>Cambiar contraseña</Subtitle2>
                        </div>
                        <div className="p-6 space-y-4">
                            <Field label="Nueva contraseña" required>
                                <Input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </Field>
                            <Field label="Confirmar contraseña" required>
                                <Input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    placeholder="Repite la nueva contraseña"
                                />
                            </Field>
                            <div className="flex justify-end">
                                <Button
                                    appearance="primary"
                                    icon={<LockClosedRegular />}
                                    onClick={cambiarPassword}
                                    disabled={savingPassword}
                                >
                                    {savingPassword ? <Spinner size="tiny" /> : 'Actualizar contraseña'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Drawer Marca */}
            <Drawer position="end" open={openMarcaDrawer} onOpenChange={(_, data) => setOpenMarcaDrawer(data.open)}>
                <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenMarcaDrawer(false)} />}>
                        <div className="flex items-center gap-2">
                            <BuildingRegular className="text-blue-600" />
                            <span className="text-lg font-bold text-slate-800">
                                {editMode ? 'Editar Marca' : 'Nueva Marca'}
                            </span>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody className="p-6 space-y-4">
                    <Field label="Nombre de la Marca" required>
                        <Input
                            value={marcaForm.nombre}
                            onChange={(e) => setMarcaForm({ ...marcaForm, nombre: e.target.value })}
                            placeholder="Ej. HP, Brother, Xerox"
                            onKeyDown={(e) => { if (e.key === 'Enter') guardarMarca() }}
                        />
                    </Field>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <Button appearance="secondary" onClick={() => setOpenMarcaDrawer(false)} disabled={savingMarca}>Cancelar</Button>
                        <Button appearance="primary" onClick={guardarMarca} disabled={savingMarca}>
                            {savingMarca ? <Spinner size="tiny" /> : (editMode ? 'Actualizar' : 'Guardar')}
                        </Button>
                    </div>
                </DrawerBody>
            </Drawer>

            {/* Drawer Modelo */}
            <Drawer position="end" open={openModeloDrawer} onOpenChange={(_, data) => setOpenModeloDrawer(data.open)}>
                <DrawerHeader className="border-b bg-gradient-to-r from-green-50 to-white">
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenModeloDrawer(false)} />}>
                        <div className="flex items-center gap-2">
                            <TagRegular className="text-green-600" />
                            <span className="text-lg font-bold text-slate-800">
                                {editMode ? 'Editar Modelo' : 'Nuevo Modelo'}
                            </span>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody className="p-6 space-y-4">
                    <Field label="Marca" required>
                        <div className="flex items-center gap-2">
                            {selectedMarca && (
                                <Avatar
                                    name={selectedMarca.nombre}
                                    initials={selectedMarca.nombre.charAt(0).toUpperCase()}
                                    style={{ backgroundColor: getBrandColor(selectedMarca.nombre), color: '#fff' }}
                                    size={20}
                                />
                            )}
                            <Input value={selectedMarca?.nombre || ''} disabled className="flex-1" />
                        </div>
                    </Field>
                    <Field label="Nombre del Modelo" required>
                        <Input
                            value={modeloForm.nombre}
                            onChange={(e) => setModeloForm({ ...modeloForm, nombre: e.target.value })}
                            placeholder="Ej. CF283A, TN3479, 006R01731"
                            onKeyDown={(e) => { if (e.key === 'Enter') guardarModelo() }}
                        />
                    </Field>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <Button appearance="secondary" onClick={() => setOpenModeloDrawer(false)} disabled={savingModelo}>Cancelar</Button>
                        <Button appearance="primary" onClick={guardarModelo} disabled={savingModelo}>
                            {savingModelo ? <Spinner size="tiny" /> : (editMode ? 'Actualizar' : 'Guardar')}
                        </Button>
                    </div>
                </DrawerBody>
            </Drawer>

            <ConfirmDialog
                title={deleteTarget?.type === 'marca' ? 'Eliminar marca' : 'Eliminar modelo'}
                open={!!deleteTarget}
                message={
                    deleteTarget?.type === 'marca'
                        ? `¿Estás seguro de eliminar la marca "${deleteTarget?.nombre}"? También se eliminarán sus modelos asociados.`
                        : `¿Estás seguro de eliminar el modelo "${deleteTarget?.nombre}"?`
                }
                onConfirm={deleteTarget?.type === 'marca' ? confirmEliminarMarca : confirmEliminarModelo}
                onCancel={() => setDeleteTarget(null)}
            />

            <Dialog open={!!bloqueoInfo} onOpenChange={(_, d) => setBloqueoInfo(d.open ? bloqueoInfo : null)}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>
                            <div className="flex items-center gap-2">
                                <WarningFilled className="text-amber-500" />
                                <span>No se puede eliminar {bloqueoInfo?.tipo === 'marca' ? 'la marca' : 'el modelo'}</span>
                            </div>
                        </DialogTitle>
                        <DialogContent>
                            <p className="text-sm text-gray-600 mb-3">
                                {bloqueoInfo?.tipo === 'marca' ? 'La marca' : 'El modelo'} <strong>"{bloqueoInfo?.nombre}"</strong> está asignado a los siguientes registros:
                            </p>
                            <Table className="w-full text-xs">
                                <TableHeader>
                                    <TableRow>
                                        <TableHeaderCell>Tipo</TableHeaderCell>
                                        <TableHeaderCell>Descripción</TableHeaderCell>
                                        <TableHeaderCell>Serie / Cant.</TableHeaderCell>
                                        <TableHeaderCell>Estado</TableHeaderCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bloqueoInfo?.items.map((item, i) => {
                                        const TipoIcon = item.tipo === 'Compra Tóner' ? CartRegular
                                            : item.tipo === 'Compra Equipo' ? BoxRegular
                                            : ['Desktop', 'Laptop', 'CPU', 'All-in-One', 'Impresora', 'Multifuncional', 'Monitor', 'Proyector', 'Escáner', 'Plotter', 'Tablet'].includes(item.tipo) ? DesktopRegular
                                            : TagRegular
                                        return (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <TipoIcon className="text-gray-400" style={{ fontSize: 14 }} />
                                                        <span>{item.tipo}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                <TableCell className="font-mono">{item.serie}</TableCell>
                                                <TableCell>
                                                    <Badge appearance="filled" color={
                                                        item.estado === 'Activo' || item.estado === 'Disponible' ? 'success'
                                                        : item.estado === 'Asignado' ? 'warning'
                                                        : item.estado === 'Agotado' || item.estado === 'Dado de Baja' || item.estado === 'Inactivo' ? 'danger'
                                                        : 'informative'
                                                    } size="extra-small">{item.estado}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="primary" onClick={() => setBloqueoInfo(null)}>Cerrar</Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </div>
    )
}

export default Configuracion
