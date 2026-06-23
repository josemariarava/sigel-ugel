import { useState, useEffect } from 'react'
import { CartRegular, DismissRegular, EditRegular, SaveRegular, BoxRegular } from '@fluentui/react-icons'
import { supabase } from '../../lib/supabaseClient'
import {
    Button,
    Badge,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Field,
    Input,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle,
    Tooltip,
    Select,
    Spinner,
    MessageBar,
    MessageBarBody
} from '@fluentui/react-components'

const DetalleOCDrawer = ({ open, onClose, compra, toners, onEditToner, onAgregarMas, onBatchUpdate }) => {
    const [batchEdit, setBatchEdit] = useState({ detalleId: null, open: false })
    const [batchForm, setBatchForm] = useState({
        lote: '', ubicacion: '', fecha_vencimiento: '', rendimiento: '',
        fecha_compra: '', proveedor: '', observaciones: ''
    })
    const [ambientes, setAmbientes] = useState([])
    const [asignacionesMap, setAsignacionesMap] = useState({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) {
            Promise.all([
                supabase.from('ambientes').select('*').order('nombre'),
                supabase.from('asignacion_toners')
                    .select('toner_id, numero_acta, persona:personas(*)')
                    .eq('estado', 'Activo')
            ]).then(([amb, asig]) => {
                setAmbientes(amb.data || [])
                const map = {}
                ;(asig.data || []).forEach(a => {
                    map[a.toner_id] = {
                        acta: a.numero_acta,
                        persona: a.persona ? `${a.persona.nombres} ${a.persona.apellidos}` : '—'
                    }
                })
                setAsignacionesMap(map)
            })
        }
    }, [open])

    const openBatchEdit = (detalle) => {
        setBatchForm({
            lote: '', ubicacion: '', fecha_vencimiento: '', rendimiento: '',
            fecha_compra: compra?.fecha_compra || '',
            proveedor: compra?.proveedor || '',
            observaciones: compra?.observaciones || ''
        })
        setBatchEdit({ detalleId: detalle.id, open: true })
    }

    const handleBatchSave = async () => {
        const bienesUpdates = {}
        if (batchForm.lote) bienesUpdates.lote = batchForm.lote
        if (batchForm.ubicacion) bienesUpdates.ubicacion_almacen = batchForm.ubicacion
        if (batchForm.fecha_vencimiento) bienesUpdates.fecha_vencimiento = batchForm.fecha_vencimiento
        if (batchForm.rendimiento) bienesUpdates.rendimiento = Number(batchForm.rendimiento)

        const compraUpdates = {}
        if (batchForm.fecha_compra) compraUpdates.fecha_compra = batchForm.fecha_compra
        if (batchForm.proveedor) compraUpdates.proveedor = batchForm.proveedor
        if (batchForm.observaciones) compraUpdates.observaciones = batchForm.observaciones

        if (Object.keys(bienesUpdates).length === 0 && Object.keys(compraUpdates).length === 0) return

        setSaving(true)
        try {
            const promises = []
            if (Object.keys(bienesUpdates).length > 0) {
                promises.push(
                    supabase
                        .from('bienes')
                        .update(bienesUpdates)
                        .eq('compra_detalle_id', batchEdit.detalleId)
                )
            }
            if (Object.keys(compraUpdates).length > 0) {
                promises.push(
                    supabase
                        .from('compras_toners')
                        .update(compraUpdates)
                        .eq('id', compra?.id)
                )
            }
            const results = await Promise.all(promises)
            const errors = results.filter(r => r.error).map(r => r.error.message)
            if (errors.length > 0) throw new Error(errors.join(', '))

            setBatchEdit({ detalleId: null, open: false })
            if (onBatchUpdate) onBatchUpdate()
        } catch (error) {
            console.error('Error al actualizar en lote:', error.message)
        } finally {
            setSaving(false)
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
            <DrawerHeader className="border-b border-gray-100 pb-2 bg-gradient-to-r from-teal-50 to-white">
                <DrawerHeaderTitle
                    action={
                        <div className="flex items-center gap-2">
                            <Button
                                appearance="subtle"
                                icon={<CartRegular />}
                                size="small"
                                onClick={() => {
                                    if (compra) onAgregarMas(compra)
                                }}
                                className="text-blue-600"
                            >
                                + Agregar más
                            </Button>
                            <Button
                                appearance="subtle"
                                aria-label="Close"
                                icon={<DismissRegular />}
                                onClick={onClose}
                            />
                        </div>
                    }
                >
                    <div className="flex items-center gap-2">
                        <CartRegular className="text-xl text-teal-600" />
                        <div>
                            <span className="text-lg font-bold text-slate-800">
                                Detalle O/C {compra?.orden_compra || ''}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {compra?.proveedor || ''} · {compra?.fecha_compra
                                    ? new Date(compra.fecha_compra + 'T00:00:00').toLocaleDateString('es-PE')
                                    : ''}
                            </p>
                        </div>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="p-4 space-y-6">
                {toners.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Spinner size="small" />
                        <p className="mt-3 text-sm">Cargando tóneres...</p>
                    </div>
                ) : (
                    toners.map((detalle) => (
                        <div key={detalle.id}>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge appearance="filled" color="brand" size="small">
                                    {detalle.marca} {detalle.modelo}
                                </Badge>
                                {detalle.color_toner && (
                                    <span className="text-xs uppercase text-gray-400">{detalle.color_toner}</span>
                                )}
                                <span className="text-xs text-gray-500 ml-auto">
                                    {detalle.cantidad_recibida} tóner(es)
                                </span>
                                <Button
                                    appearance="subtle"
                                    icon={<EditRegular />}
                                    size="small"
                                    onClick={() => openBatchEdit(detalle)}
                                    className="text-blue-600"
                                >
                                    Editar en lote
                                </Button>
                            </div>

                            {/* Batch edit inline form */}
                            {batchEdit.open && batchEdit.detalleId === detalle.id && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3 space-y-3">
                                    <p className="text-xs font-semibold text-blue-700 uppercase flex items-center gap-1">
                                        <EditRegular className="text-sm" /> Editar todos los tóneres de {detalle.marca} {detalle.modelo}
                                    </p>
                                    <p className="text-[10px] text-blue-500 -mt-2">
                                        Solo se actualizarán los campos que llenes
                                    </p>

                                    {/* Compra header fields */}
                                    <div className="border-b border-blue-200 pb-3 mb-1">
                                        <p className="text-[10px] text-blue-500 font-medium mb-2">
                                            Datos de la compra (se aplican a toda la O/C)
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="Fecha Compra">
                                                <Input
                                                    type="date"
                                                    value={batchForm.fecha_compra}
                                                    onChange={(e) => setBatchForm(p => ({ ...p, fecha_compra: e.target.value }))}
                                                />
                                            </Field>
                                            <Field label="Proveedor">
                                                <Input
                                                    value={batchForm.proveedor}
                                                    onChange={(e) => setBatchForm(p => ({ ...p, proveedor: e.target.value }))}
                                                    placeholder="Nuevo proveedor"
                                                />
                                            </Field>
                                        </div>
                                    </div>

                                    {/* Toner fields */}
                                    <div className="grid grid-cols-4 gap-3">
                                        <Field label="Lote">
                                            <Input
                                                value={batchForm.lote}
                                                onChange={(e) => setBatchForm(p => ({ ...p, lote: e.target.value }))}
                                                placeholder="Nuevo lote"
                                            />
                                        </Field>
                                        <Field label="Ubicación">
                                            <Select
                                                value={batchForm.ubicacion}
                                                onChange={(e, data) => setBatchForm(p => ({ ...p, ubicacion: data.value }))}
                                            >
                                                <option value="">-- Sin cambio --</option>
                                                {ambientes.map(a => (
                                                    <option key={a.id} value={a.nombre}>{a.nombre}</option>
                                                ))}
                                            </Select>
                                        </Field>
                                        <Field label="Fecha Venc.">
                                            <Input
                                                type="date"
                                                value={batchForm.fecha_vencimiento}
                                                onChange={(e) => setBatchForm(p => ({ ...p, fecha_vencimiento: e.target.value }))}
                                            />
                                        </Field>
                                        <Field label="Rendimiento">
                                            <Input
                                                type="number"
                                                value={batchForm.rendimiento}
                                                onChange={(e) => setBatchForm(p => ({ ...p, rendimiento: e.target.value }))}
                                                placeholder="págs"
                                            />
                                        </Field>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <Field label="Observaciones">
                                            <Input
                                                value={batchForm.observaciones}
                                                onChange={(e) => setBatchForm(p => ({ ...p, observaciones: e.target.value }))}
                                                placeholder="Notas u observaciones para estos tóneres"
                                            />
                                        </Field>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            appearance="subtle"
                                            size="small"
                                            onClick={() => setBatchEdit({ detalleId: null, open: false })}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            appearance="primary"
                                            icon={<SaveRegular />}
                                            size="small"
                                            onClick={handleBatchSave}
                                            disabled={saving}
                                        >
                                            {saving ? 'Guardando...' : 'Aplicar a todos'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <Table className="w-full mb-6">
                                <TableHeader>
                                    <TableRow>
                                        <TableHeaderCell>Serie</TableHeaderCell>
                                        <TableHeaderCell>Lote</TableHeaderCell>
                                        <TableHeaderCell>Fecha Venc.</TableHeaderCell>
                                        <TableHeaderCell>Estado</TableHeaderCell>
                                        <TableHeaderCell>Asignado a</TableHeaderCell>
                                        <TableHeaderCell>Ubicación</TableHeaderCell>
                                        <TableHeaderCell>Acciones</TableHeaderCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(detalle.toners || []).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-6 text-gray-400">
                                                No se encontraron tóneres individuales
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (detalle.toners || []).map((toner) => (
                                            <TableRow key={toner.id} className="hover:bg-gray-50 transition-colors">
                                                <TableCell className="font-mono text-xs">
                                                    {toner.serie || '—'}
                                                </TableCell>
                                                <TableCell className={`font-mono text-xs ${batchEdit.detalleId === detalle.id && batchForm.lote ? 'bg-yellow-50' : ''}`}>
                                                    {toner.lote || '—'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {toner.fecha_vencimiento || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge appearance="filled" color={
                                                        toner.estado === 'Disponible' || toner.estado === 'Activo'
                                                            ? 'success'
                                                            : toner.estado === 'Asignado'
                                                                ? 'warning'
                                                                : toner.estado === 'Agotado'
                                                                    ? 'danger'
                                                                    : 'seafoam'
                                                    }>
                                                        {toner.estado}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {toner.estado === 'Asignado' && asignacionesMap[toner.id] ? (
                                                        <Tooltip content={`Acta: ${asignacionesMap[toner.id].acta}`} relationship="label">
                                                            <span className="text-amber-700 font-medium cursor-default">
                                                                {asignacionesMap[toner.id].persona}
                                                            </span>
                                                        </Tooltip>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {toner.ubicacion_almacen || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip content="Editar tóner" relationship="label">
                                                        <Button
                                                            appearance="subtle"
                                                            icon={<EditRegular />}
                                                            onClick={() => {
                                                                onClose()
                                                                onEditToner(toner)
                                                            }}
                                                            size="small"
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ))
                )}
            </DrawerBody>
        </Drawer>
    )
}

export default DetalleOCDrawer
