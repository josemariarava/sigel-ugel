import { useState, useEffect, useRef, useMemo } from 'react'
import { DismissRegular, WarningRegular } from '@fluentui/react-icons'
import {
    Button,
    Drawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerBody,
    DrawerFooter,
    Field,
    Dropdown,
    Option,
    Input,
    Textarea,
    Card,
} from '@fluentui/react-components'
import ConfirmDialog from '../shared/ConfirmDialog'
import { TIPOS_TONER } from '../../lib/utils'
import { supabase } from '../../lib/supabaseClient'

export default function DrawerAsignacionToners({
    openDrawer, setOpenDrawer,
    editMode, formData, handleInputChange,
    toners, tonersDisponibles,
    selectedTonerPreview, stockMismoModelo,
    entregadoPor, setEntregadoPor,
    personas, impresoras,
    selectedPiso, setSelectedPiso,
    ambientes, ambientesFiltrados, pisos,
    handleSubmit, resetForm,
    submitting,
    impresoraConTonerActivo,
}) {
    const [showConfirmClose, setShowConfirmClose] = useState(false)
    const [localToners, setLocalToners] = useState([])
    const [localPersonas, setLocalPersonas] = useState([])
    const [localImpresoras, setLocalImpresoras] = useState([])
    const [localPisos, setLocalPisos] = useState([])
    const [localAmbientes, setLocalAmbientes] = useState([])
    const [tonerSearch, setTonerSearch] = useState('')
    const [tonerAbierto, setTonerAbierto] = useState(false)
    const [entregadoSearch, setEntregadoSearch] = useState('')
    const [responsableSearch, setResponsableSearch] = useState('')
    const [entregadoAbierto, setEntregadoAbierto] = useState(false)
    const [responsableAbierto, setResponsableAbierto] = useState(false)
    const tonerRef = useRef(null)
    const entregadoRef = useRef(null)
    const responsableRef = useRef(null)
    const initialSnapshotRef = useRef('')
    const autoPopulatedRef = useRef(false)

    useEffect(() => {
        if (openDrawer) {
            resetSearch()
            autoPopulatedRef.current = false
            initialSnapshotRef.current = JSON.stringify({ f: formData, e: entregadoPor })

            if (editMode && personas.length > 0) {
                const pEnt = personas.find(x => x.id === entregadoPor)
                if (pEnt) setEntregadoSearch(`${pEnt.apellidos}, ${pEnt.nombres}`)
                const pRes = personas.find(x => x.id === formData.persona_id)
                if (pRes) setResponsableSearch(`${pRes.apellidos}, ${pRes.nombres}`)
            }
        }
    }, [openDrawer])

    useEffect(() => {
        if (!openDrawer || editMode || autoPopulatedRef.current || personas.length === 0) return
        autoPopulatedRef.current = true
        supabase.auth.getSession().then(({ data }) => {
            const email = data?.session?.user?.email
            if (!email) return
            const match = personas.find(p => p.email?.toLowerCase() === email.toLowerCase())
            if (match) {
                setEntregadoPor(match.id)
                setEntregadoSearch(`${match.apellidos}, ${match.nombres}`)
            }
        })
    }, [openDrawer, editMode, personas])

    const formDirty = openDrawer && (
        JSON.stringify({ f: formData, e: entregadoPor }) !== initialSnapshotRef.current
    )

    const tonerOptionList = useMemo(() => {
        const base = editMode ? toners : tonersDisponibles
        if (localToners.length === 0) return base
        const merged = [...localToners]
        base.forEach(t => {
            if (!merged.some(m => m.id === t.id)) merged.push(t)
        })
        return merged
    }, [localToners, toners, tonersDisponibles, editMode])

    const tonerFiltrados = useMemo(() => {
        if (!tonerSearch) return tonerOptionList
        const q = tonerSearch.toLowerCase()
        return tonerOptionList.filter(t =>
            `${t.marca} ${t.modelo} ${t.color_toner || ''} ${t.serie || ''} ${t.lote || ''}`.toLowerCase().includes(q)
        )
    }, [tonerOptionList, tonerSearch])

    const personasParaFiltros = localPersonas.length > 0 ? localPersonas : personas

    const personasEntregadoFiltradas = useMemo(() => {
        const base = personasParaFiltros
        if (!entregadoSearch) return base
        const q = entregadoSearch.toLowerCase()
        return base.filter(p =>
            `${p.nombres} ${p.apellidos} ${p.cargo || ''}`.toLowerCase().includes(q)
        )
    }, [personasParaFiltros, entregadoSearch])

    const personasResponsableFiltradas = useMemo(() => {
        const base = personasParaFiltros
        if (!responsableSearch) return base
        const q = responsableSearch.toLowerCase()
        return base.filter(p =>
            `${p.nombres} ${p.apellidos} ${p.cargo || ''}`.toLowerCase().includes(q)
        )
    }, [personasParaFiltros, responsableSearch])

    const getTonerIcon = (t) => t?.tipo_equipo === 'Contenedor de Tóner (Residuo)' ? '🗑️' : '🧴'

    const getTonerLabel = (id) => {
        if (!id) return ''
        const list = localToners.length > 0
            ? localToners
            : (editMode ? toners : tonersDisponibles)
        const t = list.find(x => x.id === id)
        if (!t) return ''
        const icon = getTonerIcon(t)
        return `${icon} ${t.marca} ${t.modelo} - ${t.color_toner || 'N/A'} - Serie: ${t.serie || 'N/A'}`
    }

    const fetchLocalToners = async () => {
        const { data } = await supabase.from('bienes').select('*').in('tipo_equipo', TIPOS_TONER).in('estado', ['Disponible', 'Activo']).order('marca')
        if (data) setLocalToners(data)
    }

    const fetchLocalPersonas = async () => {
        const { data } = await supabase.from('personas').select('*').order('apellidos')
        if (data) setLocalPersonas(data)
    }

    const fetchLocalImpresoras = async () => {
        const { data } = await supabase.from('bienes').select('*').in('tipo_equipo', ['Impresora', 'Multifuncional']).eq('estado', 'Activo').order('marca')
        if (data) setLocalImpresoras(data)
    }

    const fetchLocalPisos = async () => {
        const { data } = await supabase.from('pisos').select('*').order('numero')
        if (data) setLocalPisos(data)
    }

    const fetchLocalAmbientes = async () => {
        const { data } = await supabase.from('ambientes').select('*, piso:pisos(*)').order('nombre')
        if (data) setLocalAmbientes(data)
    }

    const getImpresoraLabel = (id) => {
        if (!id) return ''
        const list = localImpresoras.length > 0 ? localImpresoras : impresoras
        const i = list.find(x => x.id === id)
        return i ? `🖨️ ${i.marca} ${i.modelo} - ${i.serie || 'Sin serie'}` : ''
    }

    const getPisoLabel = (id) => {
        if (!id) return ''
        const list = localPisos.length > 0 ? localPisos : pisos
        const p = list.find(x => x.id === id)
        return p ? (p.nombre || `Piso ${p.numero}`) : ''
    }

    const getAmbienteLabel = (id) => {
        if (!id) return ''
        const list = localAmbientes.length > 0 ? localAmbientes : ambientes
        const a = list.find(x => x.id === id)
        return a ? `📍 ${a.nombre} (${a.codigo})` : ''
    }

    const handleDropdownChange = (name) => (_, data) => {
        handleInputChange({ target: { name, value: data.optionValue } })
    }

    const resetSearch = () => {
        setTonerSearch('')
        setTonerAbierto(false)
        setEntregadoSearch('')
        setResponsableSearch('')
        setEntregadoAbierto(false)
        setResponsableAbierto(false)
    }

    useEffect(() => {
        const cerrar = (e) => {
            if (tonerRef.current && !tonerRef.current.contains(e.target))
                setTonerAbierto(false)
            if (entregadoRef.current && !entregadoRef.current.contains(e.target))
                setEntregadoAbierto(false)
            if (responsableRef.current && !responsableRef.current.contains(e.target))
                setResponsableAbierto(false)
        }
        document.addEventListener('mousedown', cerrar)
        return () => document.removeEventListener('mousedown', cerrar)
    }, [])

    const handleClose = () => {
        if (formDirty) {
            setShowConfirmClose(true)
        } else {
            resetSearch()
            setOpenDrawer(false)
        }
    }

    const confirmClose = () => {
        resetSearch()
        setShowConfirmClose(false)
        resetForm()
        setOpenDrawer(false)
    }

    const cancelClose = () => {
        setShowConfirmClose(false)
    }

    return (
        <>
            <Drawer
                position="end"
                open={openDrawer}
                onOpenChange={(_, data) => {
                    if (!data.open && formDirty) {
                        setShowConfirmClose(true)
                    } else {
                        setOpenDrawer(data.open)
                    }
                }}
                style={{ width: '100%', maxWidth: '1000px' }}
            >
                <DrawerHeader className="border-b border-gray-100 bg-amber-50/40">
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={handleClose} />}>
                        <div>
                            <span className="text-lg font-bold text-slate-800">
                                {editMode ? 'Editar Asignación' : 'Nueva Asignación'}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">Complete los datos para la entrega del consumible</p>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>

                <DrawerBody className="p-6 space-y-5 overflow-y-auto">
                    <Field label="Consumible a Asignar *" required>
                        {editMode ? (
                            <Input size="small" value={getTonerLabel(formData.toner_id)} disabled />
                        ) : (
                            <div ref={tonerRef} style={{ position: 'relative' }}>
                                <Input size="small"
                                    value={tonerSearch}
                                    onChange={(_, d) => {
                                        setTonerSearch(d.value)
                                        if (!d.value) handleInputChange({ target: { name: 'toner_id', value: '' } })
                                    }}
                                    onFocus={() => {
                                        fetchLocalToners()
                                        setTonerAbierto(true)
                                    }}
                                    placeholder="-- Escribir para buscar --"
                                    style={{ width: '100%' }}
                                />
                                {tonerAbierto && tonerFiltrados.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {tonerFiltrados.map(t => {
                                            const icon = getTonerIcon(t)
                                            return (
                                            <div
                                                key={t.id}
                                                className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                                onMouseDown={(e) => {
                                                    e.preventDefault()
                                                    handleInputChange({ target: { name: 'toner_id', value: t.id } })
                                                    setTonerSearch(`${icon} ${t.marca} ${t.modelo} - ${t.color_toner || 'N/A'} - Serie: ${t.serie || 'N/A'}`)
                                                    setTonerAbierto(false)
                                                }}
                                            >
                                                <span className="text-base">{icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{t.marca} {t.modelo}</span>
                                                        {t.tipo_equipo === 'Contenedor de Tóner (Residuo)' && (
                                                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium shrink-0">Contenedor</span>
                                                        )}
                                                    </div>
                                                    <span className="text-gray-400 ml-0">- {t.color_toner || 'N/A'} - Serie: {t.serie || 'N/A'}</span>
                                                </div>
                                            </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </Field>

                    {selectedTonerPreview && (
                        <Card appearance="outline" className="border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                {selectedTonerPreview.tipo_equipo === 'Contenedor de Tóner (Residuo)' ? (
                                    <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">🗑️ Contenedor de Tóner (Residuo)</span>
                                ) : (
                                    <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">🧴 Tóner</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-800">
                                    {selectedTonerPreview.marca} {selectedTonerPreview.modelo}
                                </span>
                                {selectedTonerPreview.color_toner && (
                                    <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                                        {selectedTonerPreview.color_toner}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs text-gray-600">
                                <div>
                                    <span className="text-gray-400 uppercase tracking-wider text-[10px]">Serie</span>
                                    <p className="font-mono">{selectedTonerPreview.serie || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 uppercase tracking-wider text-[10px]">Lote</span>
                                    <p className="font-mono">{selectedTonerPreview.lote || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 uppercase tracking-wider text-[10px]">Vencimiento</span>
                                    <p>{selectedTonerPreview.fecha_vencimiento || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 uppercase tracking-wider text-[10px]">Ubicación</span>
                                    <p>{selectedTonerPreview.ubicacion_almacen || '—'}</p>
                                </div>
                            </div>
                            {selectedTonerPreview.veces_asignado > 0 && (
                                <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">
                                    ↩️ Este tóner ya fue asignado {selectedTonerPreview.veces_asignado} vez{selectedTonerPreview.veces_asignado !== 1 ? 'es' : ''} anteriormente
                                </div>
                            )}
                            {selectedTonerPreview.compra_detalle?.compra && (
                                <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-2 mt-2">
                                    O/C: <strong>{selectedTonerPreview.compra_detalle.compra.orden_compra}</strong>
                                    {selectedTonerPreview.compra_detalle.compra.proveedor && ` | ${selectedTonerPreview.compra_detalle.compra.proveedor}`}
                                </div>
                            )}
                            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-xs">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    Disp: <strong>{stockMismoModelo.disponibles}</strong>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    Asig: <strong>{stockMismoModelo.asignados}</strong>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    Total: <strong>{stockMismoModelo.total}</strong>
                                </span>
                                {stockMismoModelo.disponibles === 0 && (
                                    <span className="text-red-600 font-medium ml-auto">⚠️ Sin stock disponible</span>
                                )}
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Field label="Entregado por *" required>
                            <div ref={entregadoRef} style={{ position: 'relative' }}>
                                <Input size="small"
                                    value={entregadoSearch}
                                    onChange={(_, d) => {
                                        setEntregadoSearch(d.value)
                                        if (!d.value) setEntregadoPor('')
                                    }}
                                    onFocus={() => {
                                        fetchLocalPersonas()
                                        setEntregadoAbierto(true)
                                    }}
                                    placeholder="-- Escribir para buscar --"
                                    style={{ width: '100%' }}
                                />
                                {entregadoAbierto && personasEntregadoFiltradas.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {personasEntregadoFiltradas.map(p => (
                                            <div
                                                key={p.id}
                                                className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                                onMouseDown={(e) => {
                                                    e.preventDefault()
                                                    setEntregadoPor(p.id)
                                                    setEntregadoSearch(`${p.apellidos}, ${p.nombres}`)
                                                    setEntregadoAbierto(false)
                                                }}
                                            >
                                                <span className="text-base">👤</span>
                                                <div>
                                                    <span className="font-medium">{p.apellidos}, {p.nombres}</span>
                                                    {p.cargo && <span className="text-gray-400 ml-1">- {p.cargo}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Field>

                        <Field label="Responsable que Recibe *" required>
                            <div ref={responsableRef} style={{ position: 'relative' }}>
                                <Input size="small"
                                    value={responsableSearch}
                                    onChange={(_, d) => {
                                        setResponsableSearch(d.value)
                                        if (!d.value) handleInputChange({ target: { name: 'persona_id', value: '' } })
                                    }}
                                    onFocus={() => {
                                        fetchLocalPersonas()
                                        setResponsableAbierto(true)
                                    }}
                                    placeholder="-- Escribir para buscar --"
                                    style={{ width: '100%' }}
                                />
                                {responsableAbierto && personasResponsableFiltradas.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {personasResponsableFiltradas.map(p => (
                                            <div
                                                key={p.id}
                                                className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                                onMouseDown={(e) => {
                                                    e.preventDefault()
                                                    handleInputChange({ target: { name: 'persona_id', value: p.id } })
                                                    setResponsableSearch(`${p.apellidos}, ${p.nombres}`)
                                                    setResponsableAbierto(false)
                                                }}
                                            >
                                                <span className="text-base">👤</span>
                                                <div>
                                                    <span className="font-medium">{p.apellidos}, {p.nombres}</span>
                                                    {p.cargo && <span className="text-gray-400 ml-1">- {p.cargo}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Field label="Impresora Destino">
                            <Dropdown size="small"
                                value={getImpresoraLabel(formData.impresora_id)}
                                selectedOptions={formData.impresora_id ? [formData.impresora_id] : []}
                                onOptionSelect={handleDropdownChange('impresora_id')}
                                onOpenChange={(_, data) => { if (data.open) fetchLocalImpresoras() }}
                                placeholder="-- Seleccionar Impresora --"
                            >
                                {(localImpresoras.length > 0 ? localImpresoras : impresoras).map(i => (
                                    <Option key={i.id} value={i.id}>
                                        🖨️ {i.marca} {i.modelo} - {i.serie || 'Sin serie'}
                                    </Option>
                                ))}
                            </Dropdown>
                        </Field>

                        <Field label="Piso">
                            <Dropdown size="small"
                                value={getPisoLabel(selectedPiso)}
                                selectedOptions={selectedPiso ? [selectedPiso] : []}
                                onOptionSelect={(_, data) => {
                                    setSelectedPiso(data.optionValue)
                                    handleInputChange({ target: { name: 'ambiente_id', value: '' } })
                                }}
                                onOpenChange={(_, data) => { if (data.open) fetchLocalPisos() }}
                                placeholder="-- Piso --"
                            >
                                {(localPisos.length > 0 ? localPisos : pisos).map(p => (
                                    <Option key={p.id} value={p.id}>
                                        {p.nombre || `Piso ${p.numero}`}
                                    </Option>
                                ))}
                            </Dropdown>
                        </Field>
                    </div>

                    {formData.impresora_id && impresoraConTonerActivo && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
                            <WarningRegular className="text-amber-600 mt-0.5 shrink-0" />
                            <span>Esta impresora ya tiene un tóner activo. Debe finalizar esa asignación antes de asignar uno nuevo.</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Field label="Ambiente">
                            <Dropdown size="small"
                                value={getAmbienteLabel(formData.ambiente_id)}
                                selectedOptions={formData.ambiente_id ? [formData.ambiente_id] : []}
                                onOptionSelect={(_, data) => {
                                    handleInputChange({ target: { name: 'ambiente_id', value: data.optionValue } })
                                    const amb = (localAmbientes.length > 0 ? localAmbientes : ambientes).find(a => a.id === data.optionValue)
                                    if (amb) setSelectedPiso(amb.piso_id || '')
                                }}
                                onOpenChange={(_, data) => { if (data.open) fetchLocalAmbientes() }}
                                placeholder="-- Ambiente --"
                            >
                                {(() => {
                                    const base = localAmbientes.length > 0 ? localAmbientes : ambientes
                                    const lista = selectedPiso ? base.filter(a => a.piso_id === selectedPiso) : base
                                    return lista.map(a => (
                                        <Option key={a.id} value={a.id}>
                                            📍 {a.nombre} ({a.codigo})
                                        </Option>
                                    ))
                                })()}
                            </Dropdown>
                        </Field>

                        <Field label="Fecha de Asignación">
                            <Input size="small"
                                type="date"
                                name="fecha_asignacion"
                                value={formData.fecha_asignacion}
                                onChange={handleInputChange}
                            />
                        </Field>
                    </div>

                    <Field label="Documento Referencia">
                        <Input size="small"
                            type="text"
                            name="documento_referencia"
                            value={formData.documento_referencia}
                            onChange={handleInputChange}
                            placeholder="Ej. Memorando N° 001-2026"
                        />
                    </Field>

                    <Field label="Observaciones">
                        <Textarea size="small"
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Notas adicionales sobre la entrega..."
                        />
                    </Field>
                </DrawerBody>

                <DrawerFooter className="border-t py-4 px-8 bg-gray-50 flex justify-end gap-3">
                    <Button size="small" appearance="secondary" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button size="small" appearance="primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Guardando...' : (editMode ? 'Actualizar' : 'Confirmar Asignación')}
                    </Button>
                </DrawerFooter>
            </Drawer>

            <ConfirmDialog
                open={showConfirmClose}
                title="Descartar cambios"
                message="Hay cambios sin guardar. ¿Estás seguro de que deseas cerrar?"
                confirmText="Sí, descartar"
                cancelText="Seguir editando"
                onConfirm={confirmClose}
                onCancel={cancelClose}
            />
        </>
    )
}
