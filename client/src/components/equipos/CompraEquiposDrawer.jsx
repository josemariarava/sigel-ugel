import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { DismissRegular, AddRegular, DeleteRegular, ChevronDownRegular } from '@fluentui/react-icons'
import {
    Button,
    Input,
    Textarea,
    Field,
    Select,
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerHeaderTitle,
    InfoLabel,
    MessageBar,
    MessageBarBody,
    Dialog,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@fluentui/react-components'

const TIPOS_EQUIPO_OPTGROUPS = [
    { label: '🖥️ Cómputo', options: ['Laptop', 'Desktop', 'CPU', 'All-in-One', 'Tablet'] },
    { label: '🖨️ Impresión', options: ['Impresora', 'Multifuncional', 'Plotter'] },
    { label: '📽️ Proyección y Escaneo', options: ['Proyector', 'Escáner'] },
    { label: '🌐 Redes', options: ['Router', 'Switch'] },
    { label: '⌨️ Periféricos', options: ['Monitor', 'Teclado', 'Mouse', 'Parlantes', 'Webcam'] },
    { label: '🔧 Otros', options: ['Otro'] }
]

const INITIAL_DETALLE = {
    key: 1,
    tipo_equipo: '',
    marca_id: '',
    modelo_id: '',
    marca: '',
    modelo: '',
    serie: '',
    codigo_patrimonial: '',
    costo_unitario: '',
    cantidad: 1,
    series_manual: '',
    codigos_patrimoniales_manual: '',
    procesador: '',
    ram: '',
    almacenamiento: '',
    tipo_almacenamiento: '',
    sistema_operativo: '',
    tamano_pantalla: '',
    direccion_mac: '',
    condicion: 'Bueno',
    other: ''
}

const CompraEquiposDrawer = ({ open, onClose, marcas, modelos, prefillCompraId = '', onSave }) => {
    const [compraMode, setCompraMode] = useState('nueva')
    const [existingCompras, setExistingCompras] = useState([])
    const [selectedExistingCompra, setSelectedExistingCompra] = useState('')
    const [compraForm, setCompraForm] = useState({
        orden_compra: '',
        razon_social: '',
        ruc: '',
        direccion: '',
        mes_calendario: '',
        fecha_compra: new Date().toISOString().split('T')[0],
        observaciones: ''
    })
    const [detalles, setDetalles] = useState([{ ...INITIAL_DETALLE }])
    const [isSaving, setIsSaving] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})
    const [generalError, setGeneralError] = useState('')
    const [saveError, setSaveError] = useState('')
    const [isDirty, setIsDirty] = useState(false)
    const [showCloseConfirm, setShowCloseConfirm] = useState(false)

    const cargarCatalogos = async () => {
        const comprasRes = await supabase
            .from('compras_equipos')
            .select('id, orden_compra, razon_social, ruc, direccion, mes_calendario, fecha_compra, observaciones')
            .order('fecha_compra', { ascending: false })
        setExistingCompras(comprasRes.data || [])
    }

    useEffect(() => {
        if (open) cargarCatalogos()
    }, [open])

    useEffect(() => {
        if (open && prefillCompraId && existingCompras.length > 0) {
            const compra = existingCompras.find(c => c.id === prefillCompraId)
            if (compra) {
                setCompraMode('existente')
                setSelectedExistingCompra(prefillCompraId)
                setCompraForm({
                    orden_compra: compra.orden_compra,
                    razon_social: compra.razon_social || '',
                    ruc: compra.ruc || '',
                    direccion: compra.direccion || '',
                    mes_calendario: compra.mes_calendario || '',
                    fecha_compra: compra.fecha_compra || new Date().toISOString().split('T')[0],
                    observaciones: compra.observaciones || ''
                })
            }
        }
    }, [open, prefillCompraId, existingCompras])

    const resetForm = () => {
        setCompraMode('nueva')
        setSelectedExistingCompra('')
        setCompraForm({
            orden_compra: '',
            razon_social: '',
            ruc: '',
            direccion: '',
            mes_calendario: '',
            fecha_compra: new Date().toISOString().split('T')[0],
            observaciones: ''
        })
        setDetalles([{ ...INITIAL_DETALLE, key: 1 }])
        setIsDirty(false)
        setFieldErrors({})
        setGeneralError('')
        setSaveError('')
    }

    const handleCompraInputChange = (e) => {
        const { name, value } = e.target
        setCompraForm(prev => ({ ...prev, [name]: value }))
        setIsDirty(true)
        setFieldErrors(prev => ({ ...prev, [name]: undefined }))
        setGeneralError('')
        setSaveError('')
    }

    const handleDetalleChange = (index, field, value) => {
        const nuevos = [...detalles]
        nuevos[index] = { ...nuevos[index], [field]: value }
        if (field === 'marca') {
            const matchingMarca = marcas.find(m => m.nombre.toLowerCase() === value.trim().toLowerCase())
            if (matchingMarca) {
                nuevos[index].marca_id = matchingMarca.id
                nuevos[index].marca = matchingMarca.nombre
            } else {
                nuevos[index].marca_id = ''
            }
            nuevos[index].modelo_id = ''
            nuevos[index].modelo = ''
        }
        if (field === 'modelo') {
            const modelosDeMarca = modelos.filter(m => m.marca_id === nuevos[index].marca_id)
            const matchingModelo = modelosDeMarca.find(m => m.nombre.toLowerCase() === value.trim().toLowerCase())
            if (matchingModelo) {
                nuevos[index].modelo_id = matchingModelo.id
                nuevos[index].modelo = matchingModelo.nombre
            } else {
                nuevos[index].modelo_id = ''
            }
        }
        setDetalles(nuevos)
        setIsDirty(true)
        setFieldErrors(prev => ({ ...prev, [`detalles.${index}.${field}`]: undefined }))
        setGeneralError('')
        setSaveError('')
    }

    const agregarDetalle = () => {
        setDetalles([...detalles, { ...INITIAL_DETALLE, key: detalles.length + 1 }])
    }

    const eliminarDetalle = (index) => {
        if (detalles.length <= 1) return
        setDetalles(detalles.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        const errors = {}
        setGeneralError('')
        setSaveError('')

        if (compraMode === 'nueva' && !compraForm.orden_compra.trim()) {
            errors['orden_compra'] = 'La orden de compra es obligatoria'
        }
        if (compraMode === 'existente' && !selectedExistingCompra) {
            errors['selectedExistingCompra'] = 'Selecciona una orden de compra'
        }

        detalles.forEach((det, i) => {
            if (!det.tipo_equipo) errors[`detalles.${i}.tipo_equipo`] = 'Selecciona un tipo de equipo'
            if (det.cantidad <= 1 && !det.serie.trim()) errors[`detalles.${i}.serie`] = 'La serie es obligatoria'
        })

        setFieldErrors(errors)
        if (Object.keys(errors).length > 0) return

        const expanded = detalles.flatMap(det => {
            const codigosExtra = det.cantidad > 1 && det.codigos_patrimoniales_manual?.trim()
                ? det.codigos_patrimoniales_manual.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
                : []
            const series = det.cantidad > 1
                ? (det.series_manual?.trim() ? det.series_manual.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [])
                : [det.serie].filter(Boolean)
            if (series.length === 0) return []
            return series.map((s, i) => ({
                ...det,
                serie: s,
                codigo_patrimonial: codigosExtra[i] || (i === 0 ? det.codigo_patrimonial : ''),
                cantidad: 1,
                series_manual: '',
                codigos_patrimoniales_manual: ''
            }))
        })

        if (expanded.length === 0) {
            setGeneralError('No se pudieron generar registros. Verifica las series ingresadas.')
            return
        }

        setIsSaving(true)
        try {
            await onSave({ compraForm, detalles: expanded, compraMode, selectedExistingCompra })
            resetForm()
            onClose()
        } catch (err) {
            setSaveError(err?.message || 'Ocurrió un error al guardar. Intenta de nuevo.')
        } finally {
            setIsSaving(false)
        }
    }

    const esComputo = (tipo) => ['Laptop', 'Desktop', 'CPU', 'All-in-One', 'Tablet'].includes(tipo)

    const getModelosPorMarca = (marcaId) => {
        return modelos.filter(m => m.marca_id === marcaId)
    }

    const handleClose = () => {
        if (isDirty) {
            setShowCloseConfirm(true)
        } else {
            onClose()
        }
    }

    const handleConfirmClose = () => {
        setShowCloseConfirm(false)
        resetForm()
        onClose()
    }

    const handleCancelClose = () => {
        setShowCloseConfirm(false)
    }

    return (
        <Drawer
            position="end"
            open={open}
            onOpenChange={(_, data) => {
                if (!data.open) handleClose()
            }}
            style={{ width: "900px" }}
        >
            <DrawerHeader className="border-b border-gray-100 bg-blue-50/40">
                <DrawerHeaderTitle
                    action={
                        <Button appearance="subtle" icon={<DismissRegular />} onClick={handleClose} />
                    }
                >
                    <div>
                        <span className="text-sm font-semibold text-gray-800">
                            {compraMode === 'existente'
                                ? `Agregar a O/C ${compraForm.orden_compra}`
                                : 'Registrar Compra de Equipos'}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            {compraMode === 'existente'
                                ? 'Agrega nuevos equipos a la orden de compra existente'
                                : 'Ingrese los datos de la orden de compra y los equipos adquiridos'}
                        </p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="p-4 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                {saveError && (
                    <MessageBar intent="error">
                        <MessageBarBody>{saveError}</MessageBarBody>
                    </MessageBar>
                )}
                {generalError && (
                    <MessageBar intent="error">
                        <MessageBarBody>{generalError}</MessageBarBody>
                    </MessageBar>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Modo:</span>
                    <Button
                        appearance={compraMode === 'nueva' ? 'primary' : 'subtle'}
                        size="small"
                        onClick={() => setCompraMode('nueva')}
                    >
                        Nueva orden de compra
                    </Button>
                    <Button
                        appearance={compraMode === 'existente' ? 'primary' : 'subtle'}
                        size="small"
                        onClick={() => setCompraMode('existente')}
                    >
                        Agregar a orden existente
                    </Button>
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-semibold text-blue-600">
                        {compraMode === 'nueva' ? 'Nueva Orden de Compra' : 'Agregar a Orden Existente'}
                    </p>

                    {compraMode === 'existente' ? (
                        <div className="grid grid-cols-1 gap-4">
                            <Field
                                label="Seleccionar orden de compra *"
                                required
                                validationState={fieldErrors['selectedExistingCompra'] ? 'error' : undefined}
                                validationMessage={fieldErrors['selectedExistingCompra']}
                            >
                                <Select size="small"
                                    value={selectedExistingCompra}
                                    onChange={(e, data) => {
                                        const id = data.value
                                        setSelectedExistingCompra(id)
                                        const compra = existingCompras.find(c => c.id === id)
                                        if (compra) {
                                            setCompraForm({
                                                orden_compra: compra.orden_compra,
                                                razon_social: compra.razon_social || '',
                                                ruc: compra.ruc || '',
                                                direccion: compra.direccion || '',
                                                mes_calendario: compra.mes_calendario || '',
                                                fecha_compra: compra.fecha_compra || new Date().toISOString().split('T')[0],
                                                observaciones: compra.observaciones || ''
                                            })
                                        }
                                    }}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {existingCompras.map(c => (
                                        <option key={c.id} value={c.id}>
                                            O/C {c.orden_compra} — {c.razon_social || 'Sin proveedor'}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                            <div className="text-xs text-gray-500 bg-blue-50 rounded-lg p-3 space-y-0.5">
                                <p className="font-medium text-blue-700 mb-1">📋 Datos de la compra seleccionada:</p>
                                <p>O/C: <strong>{compraForm.orden_compra || '—'}</strong></p>
                                <p>Proveedor: {compraForm.razon_social || '—'}</p>
                                {compraForm.ruc && <p>RUC: {compraForm.ruc}</p>}
                                {compraForm.direccion && <p>Dirección: {compraForm.direccion}</p>}
                                {compraForm.mes_calendario && <p>Mes: {compraForm.mes_calendario}</p>}
                                <p>Fecha: {compraForm.fecha_compra || '—'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field
                                    label="Orden de Compra *"
                                    required
                                    validationState={fieldErrors['orden_compra'] ? 'error' : undefined}
                                    validationMessage={fieldErrors['orden_compra']}
                                >
                                    <Input size="small"
                                        name="orden_compra"
                                        value={compraForm.orden_compra}
                                        onChange={handleCompraInputChange}
                                        placeholder="O/C 2026-089"
                                    />
                                </Field>
                                <Field label="Razón Social">
                                    <Input size="small"
                                        name="razon_social"
                                        value={compraForm.razon_social}
                                        onChange={handleCompraInputChange}
                                        placeholder="Razón social del proveedor"
                                    />
                                </Field>
                                <Field label="RUC">
                                    <Input size="small"
                                        name="ruc"
                                        value={compraForm.ruc}
                                        onChange={handleCompraInputChange}
                                        placeholder="20XXXXXXXXX"
                                        maxLength={11}
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Dirección">
                                    <Input size="small"
                                        name="direccion"
                                        value={compraForm.direccion}
                                        onChange={handleCompraInputChange}
                                        placeholder="Dirección del proveedor"
                                    />
                                </Field>
                                <Field label="Mes Calendario">
                                    <Input size="small"
                                        name="mes_calendario"
                                        value={compraForm.mes_calendario}
                                        onChange={handleCompraInputChange}
                                        placeholder="Ej. Enero 2026"
                                    />
                                </Field>
                                <Field label="Fecha de Compra">
                                    <Input size="small"
                                        type="date"
                                        name="fecha_compra"
                                        value={compraForm.fecha_compra}
                                        onChange={handleCompraInputChange}
                                    />
                                </Field>
                            </div>
                        </div>
                    )}

                    {compraMode === 'nueva' && (
                        <Field label="Observaciones">
                            <Textarea
                                name="observaciones"
                                value={compraForm.observaciones}
                                onChange={handleCompraInputChange}
                                rows={2}
                                placeholder="Notas sobre la compra..."
                            />
                        </Field>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-blue-600">Equipos Adquiridos</p>
                        <Button
                            appearance="outline"
                            icon={<AddRegular />}
                            onClick={agregarDetalle}
                            size="small"
                        >
                            Agregar otro equipo
                        </Button>
                    </div>

                    {detalles.map((detalle, index) => (
                        <div key={detalle.key} className="border border-gray-100 rounded-lg p-2.5 bg-blue-50/30 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-medium text-gray-400 uppercase">
                                    Equipo #{index + 1}
                                    {detalle.cantidad > 1 && <span className="text-gray-300 ml-1">· {detalle.cantidad} unidades</span>}
                                </span>
                                {detalles.length > 1 && (
                                    <Button
                            appearance="outline"
                                        icon={<DeleteRegular />}
                                        onClick={() => eliminarDetalle(index)}
                                        size="small"
                                        className="text-red-600"
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <Field
                                    label="Tipo de Equipo *"
                                    required
                                    validationState={fieldErrors[`detalles.${index}.tipo_equipo`] ? 'error' : undefined}
                                    validationMessage={fieldErrors[`detalles.${index}.tipo_equipo`]}
                                >
                                    <Select size="small"
                                        value={detalle.tipo_equipo}
                                        onChange={(e, data) => handleDetalleChange(index, 'tipo_equipo', data.value)}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {TIPOS_EQUIPO_OPTGROUPS.map(g => (
                                            <optgroup key={g.label} label={g.label}>
                                                {g.options.map(o => (
                                                    <option key={o} value={o}>{o}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </Select>
                                </Field>

                                <Field
                                    label="Serie *"
                                    validationState={fieldErrors[`detalles.${index}.serie`] ? 'error' : undefined}
                                    validationMessage={fieldErrors[`detalles.${index}.serie`]}
                                >
                                    {detalle.cantidad > 1 ? (
                                        <p className="text-xs text-gray-400 italic py-1">Usa el campo de abajo</p>
                                    ) : (
                                        <Input size="small"
                                            value={detalle.serie}
                                            onChange={(e) => handleDetalleChange(index, 'serie', e.target.value)}
                                            placeholder="N° de serie único"
                                        />
                                    )}
                                </Field>

                                <Field label="Código Patrimonial">
                                    {detalle.cantidad > 1 ? (
                                        <p className="text-xs text-gray-400 italic py-1">Usa el campo de abajo</p>
                                    ) : (
                                        <Input size="small"
                                            value={detalle.codigo_patrimonial}
                                            onChange={(e) => handleDetalleChange(index, 'codigo_patrimonial', e.target.value)}
                                            placeholder="Ej. P-2026-001"
                                        />
                                    )}
                                </Field>

                                <Field label={<InfoLabel info="Escribe para buscar en el catálogo o ingresa una nueva">Marca</InfoLabel>}>
                                    <Input size="small"
                                        value={detalle.marca}
                                        onChange={(e) => handleDetalleChange(index, 'marca', e.target.value)}
                                        placeholder="Escribe o selecciona una marca..."
                                        list="marca-list"
                                        contentAfter={<ChevronDownRegular />}
                                    />
                                    <datalist id="marca-list">
                                        {marcas.map(m => (
                                            <option key={m.id} value={m.nombre} />
                                        ))}
                                    </datalist>
                                </Field>

                                <Field label={<InfoLabel info="Escribe para buscar en el catálogo o ingresa un nuevo">Modelo</InfoLabel>}>
                                    {detalle.marca_id ? (
                                        <>
                                            <Input size="small"
                                                value={detalle.modelo}
                                                onChange={(e) => handleDetalleChange(index, 'modelo', e.target.value)}
                                                placeholder="Escribe o selecciona un modelo..."
                                                list="modelo-list"
                                                contentAfter={<ChevronDownRegular />}
                                            />
                                            <datalist id="modelo-list">
                                                {getModelosPorMarca(detalle.marca_id).map(m => (
                                                    <option key={m.id} value={m.nombre} />
                                                ))}
                                            </datalist>
                                        </>
                                    ) : (
                                        <div className="min-h-[32px] flex items-center">
                                            <p className="text-sm text-gray-400 italic">Seleccione una marca primero</p>
                                        </div>
                                    )}
                                </Field>

                                <Field label="Condición">
                                    <Select size="small"
                                        value={detalle.condicion}
                                        onChange={(e, data) => handleDetalleChange(index, 'condicion', data.value)}
                                    >
                                        <option value="Bueno">Bueno</option>
                                        <option value="Regular">Regular</option>
                                        <option value="Malo">Malo</option>
                                        <option value="Chatarra">Chatarra</option>
                                    </Select>
                                </Field>

                                <Field label="Cantidad">
                                    <Input size="small"
                                        type="number"
                                        min={1}
                                        value={detalle.cantidad}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1
                                            handleDetalleChange(index, 'cantidad', Math.max(1, val))
                                        }}
                                    />
                                </Field>
                            </div>

                            {detalle.cantidad > 1 && (() => {
                                const seriesCount = detalle.series_manual
                                    ? detalle.series_manual.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).length
                                    : 0
                                const expected = detalle.cantidad
                                return (
                                    <>
                                        <Field
                                            label={`Series (${seriesCount}/${expected} ingresadas)`}
                                            validationState={seriesCount > 0 && seriesCount < expected ? 'warning' : undefined}
                                            validationMessage={seriesCount > 0 && seriesCount < expected ? `Faltan ${expected - seriesCount} serie${expected - seriesCount !== 1 ? 's' : ''}` : undefined}
                                        >
                                            <Textarea
                                                value={detalle.series_manual}
                                                onChange={(e) => handleDetalleChange(index, 'series_manual', e.target.value)}
                                                rows={2}
                                                placeholder={`Ingresa ${expected} serie${expected !== 1 ? 's' : ''} separadas por coma o salto de línea`}
                                            />
                                        </Field>
                                        <Field label="Cód. Patrimoniales">
                                            <Textarea
                                                value={detalle.codigos_patrimoniales_manual}
                                                onChange={(e) => handleDetalleChange(index, 'codigos_patrimoniales_manual', e.target.value)}
                                                rows={2}
                                                placeholder="Ingresa los códigos patrimoniales en el mismo orden que las series"
                                            />
                                        </Field>
                                    </>
                                )
                            })()}

                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Costo Unitario (S/)">
                                    <Input size="small"
                                        type="number"
                                        step="0.01"
                                        value={detalle.costo_unitario}
                                        onChange={(e) => handleDetalleChange(index, 'costo_unitario', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </Field>
                            </div>

                            {esComputo(detalle.tipo_equipo) && (
                                <div className="pt-2 space-y-2">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase">Especificaciones de Cómputo</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Field label="Procesador">
                                            <Input size="small"
                                                value={detalle.procesador}
                                                onChange={(e) => handleDetalleChange(index, 'procesador', e.target.value)}
                                                placeholder="Ej. Intel i5 12va gen"
                                            />
                                        </Field>
                                        <Field label="RAM">
                                            <Input size="small"
                                                value={detalle.ram}
                                                onChange={(e) => handleDetalleChange(index, 'ram', e.target.value)}
                                                placeholder="Ej. 16 GB"
                                            />
                                        </Field>
                                        <Field label="Almacenamiento">
                                            <Input size="small"
                                                value={detalle.almacenamiento}
                                                onChange={(e) => handleDetalleChange(index, 'almacenamiento', e.target.value)}
                                                placeholder="Ej. 512 GB SSD"
                                            />
                                        </Field>
                                        <Field label="Tipo Almacenamiento">
                                            <Select size="small"
                                                value={detalle.tipo_almacenamiento}
                                                onChange={(e, data) => handleDetalleChange(index, 'tipo_almacenamiento', data.value)}
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                <option value="SSD">SSD</option>
                                                <option value="HDD">HDD</option>
                                                <option value="NVMe">NVMe</option>
                                                <option value="eMMC">eMMC</option>
                                            </Select>
                                        </Field>
                                        <Field label="Sistema Operativo">
                                            <Input size="small"
                                                value={detalle.sistema_operativo}
                                                onChange={(e) => handleDetalleChange(index, 'sistema_operativo', e.target.value)}
                                                placeholder="Ej. Windows 11 Pro"
                                            />
                                        </Field>
                                        <Field label="Dirección MAC">
                                            <Input size="small"
                                                value={detalle.direccion_mac}
                                                onChange={(e) => handleDetalleChange(index, 'direccion_mac', e.target.value)}
                                                placeholder="Ej. AA:BB:CC:DD:EE:FF"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {detalle.tipo_equipo === 'Monitor' && (
                                <div className="pt-2 space-y-2">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase">Especificaciones de Monitor</p>
                                    <Field label="Tamaño de Pantalla">
                                        <Input size="small"
                                            value={detalle.tamano_pantalla}
                                            onChange={(e) => handleDetalleChange(index, 'tamano_pantalla', e.target.value)}
                                            placeholder="Ej. 21.5 pulgadas"
                                        />
                                    </Field>
                                </div>
                            )}

                            <Field label="Observaciones">
                                <Textarea
                                    value={detalle.other}
                                    onChange={(e) => handleDetalleChange(index, 'other', e.target.value)}
                                    rows={2}
                                    placeholder="Notas adicionales para este equipo..."
                                />
                            </Field>
                        </div>
                    ))}
                </div>
            </DrawerBody>

            <DrawerFooter className="border-t p-3 flex items-center">
                <div className="flex gap-2">
                    <Button appearance="secondary" onClick={handleClose} disabled={isSaving} size="small">
                        Cancelar
                    </Button>
                    <Button appearance="primary" onClick={handleSave} disabled={isSaving} size="small">
                        {isSaving ? 'Guardando...' : compraMode === 'existente' ? 'Agregar a esta orden' : 'Registrar Compra'}
                    </Button>
                </div>
                <div className="flex-1 text-right text-xs text-gray-400">
                    {(() => {
                        const total = detalles.reduce((sum, d) => {
                            const unit = parseFloat(d.costo_unitario) || 0
                            return sum + unit * d.cantidad
                        }, 0)
                        const totalEquipos = detalles.reduce((sum, d) => sum + d.cantidad, 0)
                        return total > 0
                            ? <span className="font-medium text-gray-600">Total: <strong>S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong> ({totalEquipos} equipo{totalEquipos !== 1 ? 's' : ''})</span>
                            : <span>{totalEquipos} equipo{totalEquipos !== 1 ? 's' : ''}</span>
                    })()}
                </div>
            </DrawerFooter>
            <Dialog open={showCloseConfirm} onOpenChange={(_, d) => setShowCloseConfirm(d.open)}>
                <DialogSurface className="bg-blue-50/30 border border-gray-100 shadow-sm">
                    <DialogBody>
                        <DialogTitle className="text-sm font-semibold text-gray-800">¿Descartar cambios?</DialogTitle>
                        <DialogContent className="text-xs text-gray-500">
                            Hay cambios sin guardar. Si cierras ahora, se perderán los datos modificados.
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={handleCancelClose} size="small">
                                Seguir editando
                            </Button>
                            <Button appearance="primary" onClick={handleConfirmClose} size="small">
                                Descartar cambios
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </Drawer>
    )
}

export default CompraEquiposDrawer
