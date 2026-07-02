import { useState, useEffect, useRef } from 'react'
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
    const initialSnapshotRef = useRef('')

    useEffect(() => {
        if (openDrawer) {
            initialSnapshotRef.current = JSON.stringify({ f: formData, e: entregadoPor })
        }
    }, [openDrawer])

    const formDirty = openDrawer && (
        JSON.stringify({ f: formData, e: entregadoPor }) !== initialSnapshotRef.current
    )

    const getPersonaLabel = (id) => {
        if (!id) return ''
        const p = personas.find(x => x.id === id)
        return p ? `👤 ${p.apellidos}, ${p.nombres} - ${p.cargo || 'Personal'}` : ''
    }

    const getTonerLabel = (id) => {
        if (!id) return ''
        const list = editMode ? toners : tonersDisponibles
        const t = list.find(x => x.id === id)
        return t ? `🧴 ${t.marca} ${t.modelo} - ${t.color_toner || 'N/A'} - Serie: ${t.serie || 'N/A'}` : ''
    }

    const getImpresoraLabel = (id) => {
        if (!id) return ''
        const i = impresoras.find(x => x.id === id)
        return i ? `🖨️ ${i.marca} ${i.modelo} - ${i.serie || 'Sin serie'}` : ''
    }

    const getPisoLabel = (id) => {
        if (!id) return ''
        const p = pisos.find(x => x.id === id)
        return p ? (p.nombre || `Piso ${p.numero}`) : ''
    }

    const getAmbienteLabel = (id) => {
        if (!id) return ''
        const a = ambientes.find(x => x.id === id)
        return a ? `📍 ${a.nombre} (${a.codigo})` : ''
    }

    const handleDropdownChange = (name) => (_, data) => {
        handleInputChange({ target: { name, value: data.optionValue } })
    }

    const handleClose = () => {
        if (formDirty) {
            setShowConfirmClose(true)
        } else {
            setOpenDrawer(false)
        }
    }

    const confirmClose = () => {
        setShowConfirmClose(false)
        resetForm()
        setOpenDrawer(false)
    }

    const cancelClose = () => {
        setShowConfirmClose(false)
    }

    const tonerOptionList = (editMode ? toners : tonersDisponibles)

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
                <DrawerHeader className="border-b bg-gradient-to-r from-amber-50 to-white">
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={handleClose} />}>
                        <div>
                            <span className="text-lg font-bold text-slate-800">
                                {editMode ? 'Editar Asignación de Tóner' : 'Nueva Asignación de Tóner'}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">Complete los datos para la entrega del consumible</p>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>

                <DrawerBody className="p-8 space-y-7 overflow-y-auto">
                    <Field label="Tóner a Asignar *" required>
                        <Dropdown
                            value={getTonerLabel(formData.toner_id)}
                            selectedOptions={formData.toner_id ? [formData.toner_id] : []}
                            onOptionSelect={handleDropdownChange('toner_id')}
                            placeholder="-- Seleccionar Tóner --"
                            disabled={editMode}
                        >
                            {tonerOptionList.map(t => (
                                <Option key={t.id} value={t.id}>
                                    🧴 {t.marca} {t.modelo} - {t.color_toner || 'N/A'} - Serie: {t.serie || 'N/A'}
                                </Option>
                            ))}
                        </Dropdown>
                    </Field>

                    {selectedTonerPreview && (
                        <Card appearance="outline" className="border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-800">
                                    📦 {selectedTonerPreview.marca} {selectedTonerPreview.modelo}
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
                            <Dropdown
                                value={getPersonaLabel(entregadoPor)}
                                selectedOptions={entregadoPor ? [entregadoPor] : []}
                                onOptionSelect={(_, data) => setEntregadoPor(data.optionValue)}
                                placeholder="-- Seleccionar quien entrega --"
                            >
                                {personas.map(p => (
                                    <Option key={p.id} value={p.id}>
                                        👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                                    </Option>
                                ))}
                            </Dropdown>
                        </Field>

                        <Field label="Responsable que Recibe *" required>
                            <Dropdown
                                value={getPersonaLabel(formData.persona_id)}
                                selectedOptions={formData.persona_id ? [formData.persona_id] : []}
                                onOptionSelect={handleDropdownChange('persona_id')}
                                placeholder="-- Seleccionar Responsable --"
                            >
                                {personas.map(p => (
                                    <Option key={p.id} value={p.id}>
                                        👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                                    </Option>
                                ))}
                            </Dropdown>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Field label="Impresora Destino">
                            <Dropdown
                                value={getImpresoraLabel(formData.impresora_id)}
                                selectedOptions={formData.impresora_id ? [formData.impresora_id] : []}
                                onOptionSelect={handleDropdownChange('impresora_id')}
                                placeholder="-- Seleccionar Impresora --"
                            >
                                {impresoras.map(i => (
                                    <Option key={i.id} value={i.id}>
                                        🖨️ {i.marca} {i.modelo} - {i.serie || 'Sin serie'}
                                    </Option>
                                ))}
                            </Dropdown>
                        </Field>

                        <Field label="Piso">
                            <Dropdown
                                value={getPisoLabel(selectedPiso)}
                                selectedOptions={selectedPiso ? [selectedPiso] : []}
                                onOptionSelect={(_, data) => {
                                    setSelectedPiso(data.optionValue)
                                    handleInputChange({ target: { name: 'ambiente_id', value: '' } })
                                }}
                                placeholder="-- Piso --"
                            >
                                {pisos.map(p => (
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
                            <Dropdown
                                value={getAmbienteLabel(formData.ambiente_id)}
                                selectedOptions={formData.ambiente_id ? [formData.ambiente_id] : []}
                                onOptionSelect={(_, data) => {
                                    handleInputChange({ target: { name: 'ambiente_id', value: data.optionValue } })
                                    const amb = ambientes.find(a => a.id === data.optionValue)
                                    if (amb) setSelectedPiso(amb.piso_id || '')
                                }}
                                placeholder="-- Ambiente --"
                            >
                                {(selectedPiso ? ambientesFiltrados : ambientes).map(a => (
                                    <Option key={a.id} value={a.id}>
                                        📍 {a.nombre} ({a.codigo})
                                    </Option>
                                ))}
                            </Dropdown>
                        </Field>

                        <Field label="Fecha de Asignación">
                            <Input
                                type="date"
                                name="fecha_asignacion"
                                value={formData.fecha_asignacion}
                                onChange={handleInputChange}
                            />
                        </Field>
                    </div>

                    <Field label="Documento Referencia">
                        <Input
                            type="text"
                            name="documento_referencia"
                            value={formData.documento_referencia}
                            onChange={handleInputChange}
                            placeholder="Ej. Memorando N° 001-2026"
                        />
                    </Field>

                    <Field label="Observaciones">
                        <Textarea
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Notas adicionales sobre la entrega..."
                        />
                    </Field>
                </DrawerBody>

                <DrawerFooter className="border-t py-4 px-8 bg-gray-50 flex justify-end gap-3">
                    <Button appearance="secondary" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button appearance="primary" onClick={handleSubmit} disabled={submitting}>
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
