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
    DrawerHeader,
    DrawerHeaderTitle,
    Subtitle2,
    Divider
} from '@fluentui/react-components'

const TIPOS_EQUIPO = [
    'Laptop', 'Desktop', 'CPU', 'All-in-One', 'Tablet',
    'Monitor', 'Impresora', 'Multifuncional', 'Proyector',
    'Escáner', 'Plotter', 'Router', 'Switch', 'Teclado', 'Mouse',
    'Parlantes', 'Webcam', 'Otro'
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
    }

    const handleCompraInputChange = (e) => {
        const { name, value } = e.target
        setCompraForm(prev => ({ ...prev, [name]: value }))
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
        if (detalles.length === 0 || detalles.every(d => !d.serie)) return

        setIsSaving(true)
        try {
            await onSave({ compraForm, detalles, compraMode, selectedExistingCompra })
            resetForm()
            onClose()
        } catch {
        } finally {
            setIsSaving(false)
        }
    }

    const esComputo = (tipo) => ['Laptop', 'Desktop', 'CPU', 'All-in-One', 'Tablet'].includes(tipo)

    const getModelosPorMarca = (marcaId) => {
        return modelos.filter(m => m.marca_id === marcaId)
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
            <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                <DrawerHeaderTitle
                    action={
                        <Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} />
                    }
                >
                    <div>
                        <span className="text-lg font-bold text-slate-800">
                            {compraMode === 'existente'
                                ? `📦 Agregar a O/C ${compraForm.orden_compra}`
                                : '📦 Registrar Compra de Equipos'}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {compraMode === 'existente'
                                ? 'Agrega nuevos equipos a la orden de compra existente'
                                : 'Ingrese los datos de la orden de compra y los equipos adquiridos'}
                        </p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="p-6 overflow-y-auto space-y-6" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-blue-800">Modo:</span>
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

                <div className="flex flex-col gap-3">
                    <Subtitle2 className="text-blue-700 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                        {compraMode === 'nueva' ? 'Nueva Orden de Compra' : 'Agregar a Orden Existente'}
                    </Subtitle2>
                    <Divider />

                    {compraMode === 'existente' ? (
                        <div className="grid grid-cols-1 gap-4">
                            <Field label="Seleccionar orden de compra *" required>
                                <Select
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
                                <Field label="Orden de Compra *" required>
                                    <Input
                                        name="orden_compra"
                                        value={compraForm.orden_compra}
                                        onChange={handleCompraInputChange}
                                        placeholder="O/C 2026-089"
                                    />
                                </Field>
                                <Field label="Razón Social">
                                    <Input
                                        name="razon_social"
                                        value={compraForm.razon_social}
                                        onChange={handleCompraInputChange}
                                        placeholder="Razón social del proveedor"
                                    />
                                </Field>
                                <Field label="RUC">
                                    <Input
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
                                    <Input
                                        name="direccion"
                                        value={compraForm.direccion}
                                        onChange={handleCompraInputChange}
                                        placeholder="Dirección del proveedor"
                                    />
                                </Field>
                                <Field label="Mes Calendario">
                                    <Input
                                        name="mes_calendario"
                                        value={compraForm.mes_calendario}
                                        onChange={handleCompraInputChange}
                                        placeholder="Ej. Enero 2026"
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

                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <Subtitle2 className="text-blue-700 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                            Equipos Adquiridos
                        </Subtitle2>
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
                        <div key={detalle.key} className="border border-blue-200 rounded-xl p-4 bg-blue-50/50 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-blue-700 uppercase">Equipo #{index + 1}</span>
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

                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Tipo de Equipo *" required>
                                    <Select
                                        value={detalle.tipo_equipo}
                                        onChange={(e, data) => handleDetalleChange(index, 'tipo_equipo', data.value)}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {TIPOS_EQUIPO.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </Select>
                                </Field>

                                <Field label="Serie *">
                                    <Input
                                        value={detalle.serie}
                                        onChange={(e) => handleDetalleChange(index, 'serie', e.target.value)}
                                        placeholder="N° de serie único"
                                    />
                                </Field>

                                <Field label="Código Patrimonial">
                                    <Input
                                        value={detalle.codigo_patrimonial}
                                        onChange={(e) => handleDetalleChange(index, 'codigo_patrimonial', e.target.value)}
                                        placeholder="Ej. P-2026-001"
                                    />
                                </Field>

                                <Field label="Marca">
                                    <Input
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
                                    <p className="text-[11px] text-gray-400 mt-1">Escribe para buscar en el catálogo o ingresa una nueva</p>
                                </Field>

                                <Field label="Modelo">
                                    {detalle.marca_id ? (
                                        <>
                                            <Input
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
                                            <p className="text-[11px] text-gray-400 mt-1">Escribe para buscar en el catálogo o ingresa un nuevo</p>
                                        </>
                                    ) : (
                                        <div className="min-h-[52px] flex items-center">
                                            <p className="text-sm text-gray-400 italic">Seleccione una marca primero</p>
                                        </div>
                                    )}
                                </Field>

                                <Field label="Condición">
                                    <Select
                                        value={detalle.condicion}
                                        onChange={(e, data) => handleDetalleChange(index, 'condicion', data.value)}
                                    >
                                        <option value="Bueno">Bueno</option>
                                        <option value="Regular">Regular</option>
                                        <option value="Malo">Malo</option>
                                        <option value="Chatarra">Chatarra</option>
                                    </Select>
                                    <p className="text-[11px] text-gray-400 mt-1">Estado físico del equipo</p>
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
                            </div>

                            {esComputo(detalle.tipo_equipo) && (
                                <div className="bg-white rounded-lg p-3 border border-blue-200 space-y-3">
                                    <p className="text-xs font-semibold text-blue-600 uppercase">Especificaciones de Cómputo</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Field label="Procesador">
                                            <Input
                                                value={detalle.procesador}
                                                onChange={(e) => handleDetalleChange(index, 'procesador', e.target.value)}
                                                placeholder="Ej. Intel i5 12va gen"
                                            />
                                        </Field>
                                        <Field label="RAM">
                                            <Input
                                                value={detalle.ram}
                                                onChange={(e) => handleDetalleChange(index, 'ram', e.target.value)}
                                                placeholder="Ej. 16 GB"
                                            />
                                        </Field>
                                        <Field label="Almacenamiento">
                                            <Input
                                                value={detalle.almacenamiento}
                                                onChange={(e) => handleDetalleChange(index, 'almacenamiento', e.target.value)}
                                                placeholder="Ej. 512 GB SSD"
                                            />
                                        </Field>
                                        <Field label="Tipo Almacenamiento">
                                            <Select
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
                                            <Input
                                                value={detalle.sistema_operativo}
                                                onChange={(e) => handleDetalleChange(index, 'sistema_operativo', e.target.value)}
                                                placeholder="Ej. Windows 11 Pro"
                                            />
                                        </Field>
                                        <Field label="Dirección MAC">
                                            <Input
                                                value={detalle.direccion_mac}
                                                onChange={(e) => handleDetalleChange(index, 'direccion_mac', e.target.value)}
                                                placeholder="Ej. AA:BB:CC:DD:EE:FF"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {detalle.tipo_equipo === 'Monitor' && (
                                <div className="bg-white rounded-lg p-3 border border-blue-200 space-y-3">
                                    <p className="text-xs font-semibold text-blue-600 uppercase">Especificaciones de Monitor</p>
                                    <Field label="Tamaño de Pantalla">
                                        <Input
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

export default CompraEquiposDrawer
