import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'
import {
    AddRegular,
    EditRegular,
    DeleteRegular,
    SearchRegular,
    ArrowSyncRegular,
    DismissRegular,
    BuildingRegular,
    LocationRegular,
    LockClosedRegular
} from '@fluentui/react-icons'
import {
    Button,
    useToastController,
    Toast,
    ToastTitle,
    ToastBody,
    Toaster,
    Input,
    Field,
    Subtitle2,
    Divider,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle,
    Badge
} from '@fluentui/react-components'
import ConfirmDialog from '../components/shared/ConfirmDialog'

const Ambientes = () => {
    const [activeSubTab, setActiveSubTab] = useState('ambientes')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [ambientes, setAmbientes] = useState([])
    const [pisos, setPisos] = useState([])
    const [areas, setAreas] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [openDrawer, setOpenDrawer] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)

    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        piso_id: '',
        area_id: '',
        tipo: '',
        descripcion: ''
    })

    const initialFormAmbiente = {
        nombre: '', codigo: '', piso_id: '', area_id: '', tipo: '', descripcion: ''
    }
    const initialFormPiso = { numero: '', nombre: '' }
    const initialFormArea = { nombre: '', descripcion: '' }

    const { dispatchToast } = useToastController()

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        try {
            setLoading(true)
            const [ambientesResult, pisosResult, areasResult] = await Promise.all([
                supabase.from('ambientes').select('*, piso:pisos(*), area:areas(*)').order('nombre'),
                supabase.from('pisos').select('*').order('numero'),
                supabase.from('areas').select('*').order('nombre')
            ])

            if (ambientesResult.error) throw ambientesResult.error
            if (pisosResult.error) throw pisosResult.error
            if (areasResult.error) throw areasResult.error
            setAmbientes(ambientesResult.data || [])
            setPisos(pisosResult.data || [])
            setAreas(areasResult.data || [])
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar datos'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const mostrarToast = (mensaje, tipo = 'success') => {
        dispatchToast(
            <Toast>
                <ToastTitle>{tipo === 'success' ? '✅ Éxito' : '❌ Error'}</ToastTitle>
                <ToastBody>{mensaje}</ToastBody>
            </Toast>,
            { intent: tipo }
        )
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const abrirDrawer = (item = null) => {
        setEditMode(!!item)
        setSelectedItem(item)
        if (activeSubTab === 'ambientes') {
            setFormData(item ? {
                nombre: item.nombre,
                codigo: item.codigo || '',
                piso_id: item.piso_id || '',
                area_id: item.area_id || '',
                tipo: item.tipo || '',
                descripcion: item.descripcion || ''
            } : { ...initialFormAmbiente })
        } else if (activeSubTab === 'pisos') {
            setFormData(item ? { numero: String(item.numero || ''), nombre: item.nombre || '' } : { ...initialFormPiso })
        } else {
            setFormData(item ? { nombre: item.nombre, descripcion: item.descripcion || '' } : { ...initialFormArea })
        }
        setOpenDrawer(true)
    }

    const handleSubmit = async () => {
        try {
            if (activeSubTab === 'ambientes') {
                if (!formData.nombre.trim()) {
                    mostrarToast('El nombre del ambiente es obligatorio', 'error')
                    return
                }
                if (editMode && selectedItem && esAlmacenGeneral(selectedItem) && formData.nombre.trim() !== selectedItem.nombre) {
                    mostrarToast('No se puede renombrar el Almacén General porque es requerido por el sistema', 'error')
                    return
                }
                const payload = {
                    nombre: formData.nombre.trim(),
                    codigo: formData.codigo.trim() || null,
                    piso_id: formData.piso_id || null,
                    area_id: formData.area_id || null,
                    tipo: formData.tipo || null,
                    descripcion: formData.descripcion.trim() || null
                }
                if (editMode) {
                    const { error } = await supabase.from('ambientes').update(payload).eq('id', selectedItem.id)
                    if (error) throw error
                    mostrarToast('Ambiente actualizado correctamente')
                } else {
                    const { error } = await supabase.from('ambientes').insert([payload])
                    if (error) throw error
                    mostrarToast('Ambiente registrado correctamente')
                }
            } else if (activeSubTab === 'pisos') {
                if (!formData.numero && !formData.nombre.trim()) {
                    mostrarToast('Complete el número o nombre del piso', 'error')
                    return
                }
                const payload = {
                    numero: formData.numero ? parseInt(formData.numero) : 0,
                    nombre: formData.nombre.trim() || null
                }
                if (editMode) {
                    const { error } = await supabase.from('pisos').update(payload).eq('id', selectedItem.id)
                    if (error) throw error
                    mostrarToast('Piso actualizado correctamente')
                } else {
                    const { error } = await supabase.from('pisos').insert([payload])
                    if (error) throw error
                    mostrarToast('Piso registrado correctamente')
                }
            } else {
                if (!formData.nombre.trim()) {
                    mostrarToast('El nombre del área es obligatorio', 'error')
                    return
                }
                const payload = {
                    nombre: formData.nombre.trim(),
                    descripcion: formData.descripcion.trim() || null
                }
                if (editMode) {
                    const { error } = await supabase.from('areas').update(payload).eq('id', selectedItem.id)
                    if (error) throw error
                    mostrarToast('Área actualizada correctamente')
                } else {
                    const { error } = await supabase.from('areas').insert([payload])
                    if (error) throw error
                    mostrarToast('Área registrada correctamente')
                }
            }

            setOpenDrawer(false)
            cargarDatos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'guardar'), 'error')
        }
    }

    const handleDelete = (id, nombre) => {
        setDeleteTarget({ id, nombre })
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        const { id } = deleteTarget
        try {
            if (activeSubTab === 'ambientes') {
                const amb = ambientes.find(a => a.id === id)
                if (amb && esAlmacenGeneral(amb)) {
                    mostrarToast('No se puede eliminar el Almacén General porque es requerido por el sistema', 'error')
                    return
                }
                const { data: asigs } = await supabase.from('asignaciones').select('id').eq('ambiente_id', id).limit(1)
                if (asigs && asigs.length > 0) {
                    mostrarToast('No se puede eliminar porque tiene bienes asignados', 'error')
                    return
                }
                const { error } = await supabase.from('ambientes').delete().eq('id', id)
                if (error) throw error
                mostrarToast('Ambiente eliminado correctamente')
            } else if (activeSubTab === 'pisos') {
                const { data: ambs } = await supabase.from('ambientes').select('id').eq('piso_id', id).limit(1)
                if (ambs && ambs.length > 0) {
                    mostrarToast('No se puede eliminar porque tiene ambientes asociados', 'error')
                    return
                }
                const { error } = await supabase.from('pisos').delete().eq('id', id)
                if (error) throw error
                mostrarToast('Piso eliminado correctamente')
            } else {
                const { data: ambs } = await supabase.from('ambientes').select('id').eq('area_id', id).limit(1)
                if (ambs && ambs.length > 0) {
                    mostrarToast('No se puede eliminar porque tiene ambientes asociados', 'error')
                    return
                }
                const { error } = await supabase.from('areas').delete().eq('id', id)
                if (error) throw error
                mostrarToast('Área eliminada correctamente')
            }
            cargarDatos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'eliminar'), 'error')
        } finally {
            setDeleteTarget(null)
        }
    }

    const filteredAmbientes = ambientes.filter(a =>
        a.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.piso?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.area?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const esAlmacenGeneral = (amb) =>
        amb?.nombre === 'Almacén General' || amb?.tipo === 'Almacén'

    const getTipoBadge = (tipo) => {
        switch (tipo) {
            case 'Oficina': return { color: 'brand', label: '🏢 Oficina' }
            case 'Almacén': return { color: 'warning', label: '📦 Almacén' }
            case 'Aula': return { color: 'success', label: '📚 Aula' }
            case 'Sala': return { color: 'severe', label: '🪑 Sala' }
            default: return { color: 'neutral', label: tipo || 'Otro' }
        }
    }

    const getTituloDrawer = () => {
        if (activeSubTab === 'ambientes') return editMode ? '✏️ Editar Ambiente' : '📝 Nuevo Ambiente'
        if (activeSubTab === 'pisos') return editMode ? '✏️ Editar Piso' : '📝 Nuevo Piso'
        return editMode ? '✏️ Editar Área' : '📝 Nueva Área'
    }

    const getSubtituloDrawer = () => {
        if (activeSubTab === 'ambientes') return 'Complete los datos del espacio físico'
        if (activeSubTab === 'pisos') return 'Registre los pisos del edificio'
        return 'Registre las áreas institucionales'
    }

    return (
        <div className="p-1">
            <Toaster />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Ubicaciones</h1>
                    <p className="text-sm text-gray-500">Administración de ambientes, pisos y áreas institucionales</p>
                </div>
                <Button appearance="primary" icon={<AddRegular />} onClick={() => abrirDrawer()}>
                    {activeSubTab === 'ambientes' ? 'Nuevo Ambiente' : activeSubTab === 'pisos' ? 'Nuevo Piso' : 'Nueva Área'}
                </Button>
            </div>

            {/* TABS */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-1">
                    <button
                        onClick={() => { setActiveSubTab('ambientes'); setSearchTerm('') }}
                        className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${activeSubTab === 'ambientes'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <LocationRegular className="inline mr-1" style={{ fontSize: '14px' }} />
                        Ambientes
                    </button>
                    <button
                        onClick={() => { setActiveSubTab('pisos'); setSearchTerm('') }}
                        className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${activeSubTab === 'pisos'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        🏗️ Pisos
                    </button>
                    <button
                        onClick={() => { setActiveSubTab('areas'); setSearchTerm('') }}
                        className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${activeSubTab === 'areas'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        📋 Áreas
                    </button>
                </nav>
            </div>

            {/* SEARCH (solo ambientes) */}
            {activeSubTab === 'ambientes' && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex gap-3 items-center">
                    <div className="flex-1 relative">
                        <SearchRegular className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, código, piso, área o tipo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg"
                        />
                    </div>
                    <Button icon={<ArrowSyncRegular />} onClick={cargarDatos} appearance="subtle">Actualizar</Button>
                </div>
            )}

            {/* TABLA */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : activeSubTab === 'ambientes' ? (
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/70">
                                <TableRow>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Nombre</span></TableHeaderCell>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Código</span></TableHeaderCell>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Piso</span></TableHeaderCell>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Área</span></TableHeaderCell>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Tipo</span></TableHeaderCell>
                                    <TableHeaderCell className="text-center"><span className="font-semibold text-gray-700 text-xs">Acciones</span></TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAmbientes.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400 italic">No hay ambientes registrados.</TableCell></TableRow>
                                ) : (
                                    filteredAmbientes.map((amb) => {
                                        const badge = getTipoBadge(amb.tipo)
                                        const esSistema = esAlmacenGeneral(amb)
                                        return (
                                            <TableRow key={amb.id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell>
                                                    <span className="font-medium text-gray-800 text-sm">
                                                        {amb.nombre}
                                                        {esSistema && (
                                                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                                <LockClosedRegular style={{ fontSize: '11px' }} />
                                                                Sistema
                                                            </span>
                                                        )}
                                                    </span>
                                                </TableCell>
                                                <TableCell><span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{amb.codigo || '-'}</span></TableCell>
                                                <TableCell className="text-sm text-gray-700">
                                                    {amb.piso ? (
                                                        <div className="flex items-center gap-1">
                                                            <BuildingRegular className="text-gray-400" style={{ fontSize: '14px' }} />
                                                            {amb.piso.nombre || `Piso ${amb.piso.numero}`}
                                                        </div>
                                                    ) : <span className="text-gray-300 italic text-xs">Sin piso</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {amb.area ? (
                                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">{amb.area.nombre}</span>
                                                    ) : <span className="text-gray-300 italic text-xs">Sin área</span>}
                                                </TableCell>
                                                <TableCell><Badge appearance="filled" color={badge.color} size="small">{badge.label}</Badge></TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 justify-center">
                                                        <Button appearance="subtle" icon={<EditRegular className="text-blue-600" />} onClick={() => abrirDrawer(amb)} size="small" title={esSistema ? 'Editar (nombre protegido)' : 'Editar'} />
                                                        <Button appearance="subtle" icon={<DeleteRegular className={`${esSistema ? 'text-gray-300' : 'text-red-600'}`} />} onClick={() => handleDelete(amb.id, amb.nombre)} size="small" title={esSistema ? 'Protegido por el sistema' : 'Eliminar'} disabled={esSistema} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                ) : activeSubTab === 'pisos' ? (
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/70">
                                <TableRow>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Número</span></TableHeaderCell>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Nombre</span></TableHeaderCell>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Ambientes</span></TableHeaderCell>
                                    <TableHeaderCell className="text-center"><span className="font-semibold text-gray-700 text-xs">Acciones</span></TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pisos.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-gray-400 italic">No hay pisos registrados.</TableCell></TableRow>
                                ) : (
                                    pisos.map((p) => {
                                        const cant = ambientes.filter(a => a.piso_id === p.id).length
                                        return (
                                            <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell><span className="font-mono font-bold text-gray-700">Piso {p.numero}</span></TableCell>
                                                <TableCell className="text-sm text-gray-700">{p.nombre || <span className="text-gray-300 italic text-xs">Sin nombre</span>}</TableCell>
                                                <TableCell><Badge appearance="filled" color="brand" size="small">{cant} ambientes</Badge></TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 justify-center">
                                                        <Button appearance="subtle" icon={<EditRegular className="text-blue-600" />} onClick={() => abrirDrawer(p)} size="small" title="Editar" />
                                                        <Button appearance="subtle" icon={<DeleteRegular className="text-red-600" />} onClick={() => handleDelete(p.id, `Piso ${p.numero}`)} size="small" title="Eliminar" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/70">
                                <TableRow>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Nombre</span></TableHeaderCell>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Descripción</span></TableHeaderCell>
                                    <TableHeaderCell><span className="font-semibold text-gray-700 text-xs">Ambientes</span></TableHeaderCell>
                                    <TableHeaderCell className="text-center"><span className="font-semibold text-gray-700 text-xs">Acciones</span></TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areas.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-gray-400 italic">No hay áreas registradas.</TableCell></TableRow>
                                ) : (
                                    areas.map((a) => {
                                        const cant = ambientes.filter(amb => amb.area_id === a.id).length
                                        return (
                                            <TableRow key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell><span className="font-medium text-gray-800 text-sm">{a.nombre}</span></TableCell>
                                                <TableCell className="text-sm text-gray-500">{a.descripcion || <span className="text-gray-300 italic text-xs">Sin descripción</span>}</TableCell>
                                                <TableCell><Badge appearance="filled" color="brand" size="small">{cant} ambientes</Badge></TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 justify-center">
                                                        <Button appearance="subtle" icon={<EditRegular className="text-blue-600" />} onClick={() => abrirDrawer(a)} size="small" title="Editar" />
                                                        <Button appearance="subtle" icon={<DeleteRegular className="text-red-600" />} onClick={() => handleDelete(a.id, a.nombre)} size="small" title="Eliminar" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* DRAWER */}
            <Drawer position="end" open={openDrawer} onOpenChange={(_, data) => setOpenDrawer(data.open)} size="medium">
                <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                    <DrawerHeaderTitle
                        action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenDrawer(false)} />}
                    >
                        <div>
                            <span className="text-lg font-bold text-slate-800">{getTituloDrawer()}</span>
                            <p className="text-xs text-gray-500 mt-0.5">{getSubtituloDrawer()}</p>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>

                <DrawerBody className="p-6 my-6 space-y-5">
                    {activeSubTab === 'ambientes' && (
                        <>
                            {editMode && esAlmacenGeneral(selectedItem) && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
                                    <LockClosedRegular className="text-amber-500 mt-0.5 shrink-0" style={{ fontSize: '16px' }} />
                                    <span>Este ambiente es parte del sistema y no puede ser renombrado ni eliminado.</span>
                                </div>
                            )}
                            <div className="flex flex-col gap-3">
                                <Subtitle2 className="text-blue-700 flex items-center gap-1">
                                    <LocationRegular style={{ fontSize: '16px' }} /> Datos del Ambiente
                                </Subtitle2>
                                <Divider color="brand" />
                                <Field label="Nombre del ambiente *" required>
                                    <Input name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Ej. Oficina 101, Almacén General..." disabled={editMode && esAlmacenGeneral(selectedItem)} />
                                </Field>
                                <Field label="Código">
                                    <Input name="codigo" value={formData.codigo} onChange={handleInputChange} placeholder="Ej. OF-101, ALM-001..." />
                                </Field>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Subtitle2 className="text-blue-700 flex items-center gap-1">
                                    <BuildingRegular style={{ fontSize: '16px' }} /> Ubicación
                                </Subtitle2>
                                <Divider />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Piso">
                                        <select name="piso_id" value={formData.piso_id} onChange={handleInputChange} className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white">
                                            <option value="">-- Seleccionar piso --</option>
                                            {pisos.map(p => (
                                                <option key={p.id} value={p.id}>🏢 {p.nombre || `Piso ${p.numero}`}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Área institucional">
                                        <select name="area_id" value={formData.area_id} onChange={handleInputChange} className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white">
                                            <option value="">-- Seleccionar área --</option>
                                            {areas.map(a => (
                                                <option key={a.id} value={a.id}>📋 {a.nombre}</option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Subtitle2 className="text-blue-700 flex items-center gap-1">📐 Clasificación</Subtitle2>
                                <Divider />
                                <Field label="Tipo de ambiente">
                                    <select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white">
                                        <option value="">-- Seleccionar tipo --</option>
                                        <option value="Oficina">🏢 Oficina</option>
                                        <option value="Almacén">📦 Almacén</option>
                                        <option value="Aula">📚 Aula</option>
                                        <option value="Sala">🪑 Sala</option>
                                        <option value="Laboratorio">🔬 Laboratorio</option>
                                        <option value="Otro">📝 Otro</option>
                                    </select>
                                </Field>
                                <Field label="Descripción">
                                    <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows="3" placeholder="Descripción opcional del ambiente..." className="w-full text-sm border rounded-lg px-3 py-2.5 resize-none" />
                                </Field>
                            </div>
                        </>
                    )}

                    {activeSubTab === 'pisos' && (
                        <div className="flex flex-col gap-3">
                            <Subtitle2 className="text-blue-700 flex items-center gap-1">
                                🏗️ Datos del Piso
                            </Subtitle2>
                            <Divider color="brand" />
                            <Field label="Número de piso">
                                <Input name="numero" type="number" value={formData.numero} onChange={handleInputChange} placeholder="Ej. 1, 2, 3..." />
                            </Field>
                            <Field label="Nombre (opcional)">
                                <Input name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Ej. Primer Piso, Sótano, Azotea..." />
                            </Field>
                        </div>
                    )}

                    {activeSubTab === 'areas' && (
                        <div className="flex flex-col gap-3">
                            <Subtitle2 className="text-blue-700 flex items-center gap-1">
                                📋 Datos del Área
                            </Subtitle2>
                            <Divider color="brand" />
                            <Field label="Nombre del área *" required>
                                <Input name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Ej. Informática, Contabilidad..." />
                            </Field>
                            <Field label="Descripción">
                                <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows="3" placeholder="Descripción opcional del área..." className="w-full text-sm border rounded-lg px-3 py-2.5 resize-none" />
                            </Field>
                        </div>
                    )}
                </DrawerBody>

                <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
                    <Button appearance="secondary" onClick={() => setOpenDrawer(false)}>Cancelar</Button>
                    <Button appearance="primary" icon={<AddRegular />} onClick={handleSubmit}>
                        {editMode ? 'Actualizar' : 'Registrar'}
                    </Button>
                </div>
            </Drawer>

            <ConfirmDialog
                open={!!deleteTarget}
                message={deleteTarget ? `¿Estás seguro de eliminar "${deleteTarget.nombre}"?` : ''}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}

export default Ambientes
