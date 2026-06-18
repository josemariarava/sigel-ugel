
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { DismissRegular, AddRegular, DeleteRegular } from '@fluentui/react-icons'
import {
    Button,
    Input,
    Textarea,
    Field,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle,
    Subtitle2,
    Divider
} from '@fluentui/react-components'

const INITIAL_DETALLE = {
    key: 1,
    marca_id: '',
    modelo_id: '',
    marca: '',
    modelo: '',
    color_toner: '',
    cantidad_pedida: 1,
    cantidad_recibida: 1,
    costo_unitario: '',
    lote: '',
    rendimiento: '',
    fecha_vencimiento: '',
    ubicacion: '',
    marcaManual: false
}

const CompraTonersDrawer = ({ open, onClose, marcas, modelos, prefillCompraId = '', onSave }) => {
    const [compraMode, setCompraMode] = useState('nueva')
    const [existingCompras, setExistingCompras] = useState([])
    const [selectedExistingCompra, setSelectedExistingCompra] = useState('')
    const [compraForm, setCompraForm] = useState({
        orden_compra: '',
        proveedor: '',
        fecha_compra: new Date().toISOString().split('T')[0],
        observaciones: ''
    })
    const [detalles, setDetalles] = useState([{ ...INITIAL_DETALLE }])
    const [isSaving, setIsSaving] = useState(false)
    const [ambientes, setAmbientes] = useState([])

    const cargarCatalogos = async () => {
        const [comprasRes, ambientesRes] = await Promise.all([
            supabase.from('compras_toners')
                .select('id, orden_compra, proveedor, fecha_compra, observaciones')
                .order('fecha_compra', { ascending: false }),
            supabase.from('ambientes')
                .select('*, piso:pisos(*)')
                .order('nombre')
        ])
        setExistingCompras(comprasRes.data || [])
        setAmbientes(ambientesRes.data || [])
    }

    useEffect(() => {
        if (open) {
            cargarCatalogos()
        }
    }, [open])

    useEffect(() => {
        if (open && prefillCompraId && existingCompras.length > 0) {
            const compra = existingCompras.find(c => c.id === prefillCompraId)
            if (compra) {
                setCompraMode('existente')
                setSelectedExistingCompra(prefillCompraId)
                setCompraForm({
                    orden_compra: compra.orden_compra,
                    proveedor: compra.proveedor || '',
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
            proveedor: '',
            fecha_compra: new Date().toISOString().split('T')[0],
            observaciones: ''
        })
        setDetalles([{ ...INITIAL_DETALLE, key: 1 }])
    }

    const handleCompraInputChange = (e) => {
        const { name, value } = e.target
        setCompraForm(prev => ({ ...prev, [name]: value }))
    }

    const handleDetalleChange = (index, field, value) => {
        const nuevos = [...detalles]
        nuevos[index] = { ...nuevos[index], [field]: value }
        if (field === 'marca_id') {
            const marca = marcas.find(m => m.id === value)
            nuevos[index].marca = marca?.nombre || ''
            nuevos[index].modelo_id = ''
            nuevos[index].modelo = ''
        }
        if (field === 'modelo_id') {
            const modelo = modelos.find(m => m.id === value)
            nuevos[index].modelo = modelo?.nombre || ''
        }
        setDetalles(nuevos)
    }

    const agregarDetalle = () => {
        setDetalles([...detalles, { ...INITIAL_DETALLE, key: detalles.length + 1 }])
    }

    const eliminarDetalle = (index) => {
        if (detalles.length <= 1) return
        setDetalles(detalles.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!compraForm.orden_compra) return
        if (detalles.length === 0 || detalles.every(d => !d.marca && !d.marca_id)) return

        setIsSaving(true)
        try {
            await onSave({ compraForm, detalles, compraMode, selectedExistingCompra })
            resetForm()
            onClose()
        } catch {
            // error handled by parent via toast
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Drawer
            position="end"
            open={open}
            onOpenChange={(_, data) => {
                if (!data.open) onClose()
            }}
            style={{ width: "900px" }}
        >
            <DrawerHeader className="border-b bg-gradient-to-r from-amber-50 to-white">
                <DrawerHeaderTitle
                    action={
                        <Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} />
                    }
                >
                    <div>
                        <span className="text-lg font-bold text-slate-800">
                            {compraMode === 'existente'
                                ? `📦 Agregar a O/C ${compraForm.orden_compra}`
                                : '📦 Registrar Compra de Tóneres'}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {compraMode === 'existente'
                                ? 'Agrega nuevos modelos a la orden de compra existente'
                                : 'Ingrese los datos de la orden de compra y los modelos recibidos'}
                        </p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="p-6 overflow-y-auto space-y-6" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                {/* Modo: Nueva compra o Agregar a existente */}
                <div className="flex items-center gap-3 bg-amber-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-amber-800">Modo:</span>
                    <Button
                        appearance={compraMode === 'nueva' ? 'primary' : 'subtle'}
                        size="small"
                        onClick={() => setCompraMode('nueva')}
                    >
                        + Nueva orden de compra
                    </Button>
                    <Button
                        appearance={compraMode === 'existente' ? 'primary' : 'subtle'}
                        size="small"
                        onClick={() => setCompraMode('existente')}
                    >
                        + Agregar a orden existente
                    </Button>
                </div>

                {/* Datos de la Orden de Compra */}
                <div className="flex flex-col gap-3">
                    <Subtitle2 className="text-amber-700 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-amber-600 rounded-full"></span>
                        {compraMode === 'nueva' ? 'Nueva Orden de Compra' : 'Agregar a Orden Existente'}
                    </Subtitle2>
                    <Divider />

                    {compraMode === 'existente' ? (
                        <div className="grid grid-cols-1 gap-4">
                            <Field label="Seleccionar orden de compra *" required>
                                <select
                                    value={selectedExistingCompra}
                                    onChange={(e) => {
                                        const id = e.target.value
                                        setSelectedExistingCompra(id)
                                        const compra = existingCompras.find(c => c.id === id)
                                        if (compra) {
                                            setCompraForm({
                                                orden_compra: compra.orden_compra,
                                                proveedor: compra.proveedor || '',
                                                fecha_compra: compra.fecha_compra || new Date().toISOString().split('T')[0],
                                                observaciones: compra.observaciones || ''
                                            })
                                        }
                                    }}
                                    className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {existingCompras.map(c => (
                                        <option key={c.id} value={c.id}>
                                            O/C {c.orden_compra} — {c.proveedor || 'Sin proveedor'}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <div className="text-xs text-gray-500 bg-amber-50 rounded-lg p-3">
                                <p className="font-medium text-amber-700 mb-1">📋 Datos de la compra seleccionada:</p>
                                <p>O/C: <strong>{compraForm.orden_compra || '—'}</strong></p>
                                <p>Proveedor: {compraForm.proveedor || '—'}</p>
                                <p>Fecha: {compraForm.fecha_compra || '—'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="Orden de Compra *" required>
                                <Input
                                    name="orden_compra"
                                    value={compraForm.orden_compra}
                                    onChange={handleCompraInputChange}
                                    placeholder="O/C 2026-089"
                                />
                            </Field>
                            <Field label="Proveedor">
                                <Input
                                    name="proveedor"
                                    value={compraForm.proveedor}
                                    onChange={handleCompraInputChange}
                                    placeholder="Nombre del proveedor"
                                />
                            </Field>
                            <Field label="Fecha de Compra">
                                <Input
                                    type="date"
                                    name="fecha_compra"
                                    value={compraForm.fecha_compra}
                                    onChange={handleCompraInputChange}
                                />
                            </Field>
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

                <Divider />

                {/* Detalle de modelos comprados */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <Subtitle2 className="text-amber-700 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-amber-600 rounded-full"></span>
                            Modelos Comprados
                        </Subtitle2>
                        <Button
                            appearance="outline"
                            icon={<AddRegular />}
                            onClick={agregarDetalle}
                            size="small"
                        >
                            Agregar otro modelo
                        </Button>
                    </div>

                    {detalles.map((detalle, index) => (
                        <div key={detalle.key} className="border border-amber-200 rounded-xl p-4 bg-amber-50/50 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-amber-700 uppercase">Modelo #{index + 1}</span>
                                {detalles.length > 1 && (
                                    <Button
                                        appearance="subtle"
                                        icon={<DeleteRegular />}
                                        onClick={() => eliminarDetalle(index)}
                                        size="small"
                                        className="text-red-600"
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Marca">
                                    {detalle.marcaManual ? (
                                        <div className="space-y-1">
                                            <Input
                                                value={detalle.marca}
                                                onChange={(e) => handleDetalleChange(index, 'marca', e.target.value)}
                                                placeholder="Escribe la marca"
                                            />
                                            <button type="button" onClick={() => handleDetalleChange(index, 'marcaManual', false)} className="text-xs text-blue-600 hover:underline">
                                                📋 Usar catálogo
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <select
                                                value={detalle.marca_id}
                                                onChange={(e) => handleDetalleChange(index, 'marca_id', e.target.value)}
                                                className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {marcas.map(m => (
                                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                                ))}
                                            </select>
                                            <button type="button" onClick={() => handleDetalleChange(index, 'marcaManual', true)} className="text-xs text-blue-600 hover:underline">
                                                ✏️ Escribir manualmente
                                            </button>
                                        </div>
                                    )}
                                </Field>

                                <Field label="Modelo">
                                    {detalle.marca_id && !detalle.marcaManual ? (
                                        <select
                                            value={detalle.modelo_id}
                                            onChange={(e) => handleDetalleChange(index, 'modelo_id', e.target.value)}
                                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {modelos.filter(m => m.marca_id === detalle.marca_id).map(m => (
                                                <option key={m.id} value={m.id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Input
                                            value={detalle.modelo}
                                            onChange={(e) => handleDetalleChange(index, 'modelo', e.target.value)}
                                            placeholder="Ej. CF283A, TN3479"
                                        />
                                    )}
                                </Field>

                                <Field label="Color Tóner">
                                    <select
                                        value={detalle.color_toner}
                                        onChange={(e) => handleDetalleChange(index, 'color_toner', e.target.value)}
                                        className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                                    >
                                        <option value="">-- Color --</option>
                                        <option value="Negro">⚫ Negro</option>
                                        <option value="Cian">🔵 Cian</option>
                                        <option value="Magenta">🔴 Magenta</option>
                                        <option value="Amarillo">🟡 Amarillo</option>
                                    </select>
                                </Field>

                                <Field label="Ubicación en Almacén">
                                    <select
                                        value={detalle.ubicacion}
                                        onChange={(e) => handleDetalleChange(index, 'ubicacion', e.target.value)}
                                        className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {ambientes.map(a => (
                                            <option key={a.id} value={a.nombre}>
                                                📍 {a.nombre}{a.piso ? ` · ${a.piso.nombre}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Cant. Pedida">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={detalle.cantidad_pedida}
                                        onChange={(e) => handleDetalleChange(index, 'cantidad_pedida', e.target.value)}
                                    />
                                </Field>

                                <Field label="Cant. Recibida">
                                    <Input
                                        type="number"
                                        min="0"
                                        value={detalle.cantidad_recibida}
                                        onChange={(e) => handleDetalleChange(index, 'cantidad_recibida', e.target.value)}
                                    />
                                </Field>

                                <Field label="Costo Unitario (S/)">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={detalle.costo_unitario}
                                        onChange={(e) => handleDetalleChange(index, 'costo_unitario', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </Field>

                                <Field label="Lote">
                                    <Input
                                        value={detalle.lote}
                                        onChange={(e) => handleDetalleChange(index, 'lote', e.target.value)}
                                        placeholder="N° de lote"
                                    />
                                </Field>

                                <Field label="Rendimiento (págs)">
                                    <Input
                                        type="number"
                                        value={detalle.rendimiento}
                                        onChange={(e) => handleDetalleChange(index, 'rendimiento', e.target.value)}
                                        placeholder="1500"
                                    />
                                </Field>
                                <Field label="Fecha Vencimiento">
                                    <Input
                                        type="date"
                                        value={detalle.fecha_vencimiento}
                                        onChange={(e) => handleDetalleChange(index, 'fecha_vencimiento', e.target.value)}
                                    />
                                </Field>
                            </div>

                            {/* Preview de series a generar */}
                            {parseInt(detalle.cantidad_recibida) > 0 && (detalle.marca || detalle.marca_id) && (
                                <div className="bg-white rounded-lg p-2 border border-amber-200">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Series a generar:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {Array.from({ length: Math.min(parseInt(detalle.cantidad_recibida), 5) }, (_, i) => {
                                            const num = String(i + 1).padStart(3, '0')
                                            const serie = detalle.lote ? `${detalle.lote}-${num}` : `${compraForm.orden_compra.replace(/[/\s]/g, '-')}-${num}`
                                            return (
                                                <span key={i} className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {serie}
                                                </span>
                                            )
                                        })}
                                        {parseInt(detalle.cantidad_recibida) > 5 && (
                                            <span className="text-[10px] text-gray-400">... y {parseInt(detalle.cantidad_recibida) - 5} más</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </DrawerBody>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-2">
                <Button appearance="secondary" onClick={onClose} disabled={isSaving}>
                    Cancelar
                </Button>
                <Button appearance="primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : compraMode === 'existente' ? 'Agregar a esta orden' : 'Registrar Compra'}
                </Button>
            </div>
        </Drawer>
    )
}

export default CompraTonersDrawer
