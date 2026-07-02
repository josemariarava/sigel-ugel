import { useEffect } from 'react'
import { DesktopRegular, DismissRegular, EditRegular, DeleteRegular, SaveRegular } from '@fluentui/react-icons'
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
    Tooltip
} from '@fluentui/react-components'
import { useState } from 'react'

const DetalleOCEquiposDrawer = ({ open, onClose, compra, equipos, onEditEquipo, onDeleteEquipo, onAgregarMas, onBatchUpdate }) => {
    const [asignacionesMap, setAsignacionesMap] = useState({})
    const [batchEdit, setBatchEdit] = useState({ detalleId: null, open: false })
    const [batchForm, setBatchForm] = useState({
        fecha_compra: '', razon_social: '', ruc: '', direccion: '', mes_calendario: '', observaciones: ''
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) {
            const equipoIds = (equipos || []).flatMap(d => (d.equipos || []).map(e => e.id))
            if (equipoIds.length === 0) return
                supabase
                    .from('asignaciones')
                    .select('bien_id, numero_acta, persona:personas!fk_asignaciones_persona(*)')
                    .in('bien_id', equipoIds)
                    .order('fecha_asignacion', { ascending: true })
                    .then(({ data, error }) => {
                    if (error) {
                        console.error('[DetalleOCEquiposDrawer] asignaciones:', error)
                        return
                    }
                    const map = {}
                    ;(data || []).forEach(a => {
                        map[a.bien_id] = {
                            acta: a.numero_acta,
                            persona: a.persona ? `${a.persona.apellidos}, ${a.persona.nombres}` : '—'
                        }
                    })
                    setAsignacionesMap(map)
                })
        } else {
            setAsignacionesMap({})
        }
    }, [open, equipos])

    const openBatchEdit = (detalle) => {
        setBatchForm({
            fecha_compra: compra?.fecha_compra || '',
            razon_social: compra?.razon_social || '',
            ruc: compra?.ruc || '',
            direccion: compra?.direccion || '',
            mes_calendario: compra?.mes_calendario || '',
            observaciones: compra?.observaciones || ''
        })
        setBatchEdit({ detalleId: detalle.id, open: true })
    }

    const handleBatchSave = async () => {
        const compraUpdates = {}
        if (batchForm.fecha_compra) compraUpdates.fecha_compra = batchForm.fecha_compra
        if (batchForm.razon_social) compraUpdates.razon_social = batchForm.razon_social
        if (batchForm.ruc) compraUpdates.ruc = batchForm.ruc
        if (batchForm.direccion) compraUpdates.direccion = batchForm.direccion
        if (batchForm.mes_calendario) compraUpdates.mes_calendario = batchForm.mes_calendario
        if (batchForm.observaciones) compraUpdates.observaciones = batchForm.observaciones

        if (Object.keys(compraUpdates).length === 0) return

        setSaving(true)
        try {
            const promises = []
            if (Object.keys(compraUpdates).length > 0) {
                promises.push(
                    supabase
                        .from('compras_equipos')
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
            console.error('Error al actualizar:', error.message)
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
            <DrawerHeader className="border-b border-gray-100 pb-2 bg-gradient-to-r from-blue-50 to-white">
                <DrawerHeaderTitle
                    action={
                        <div className="flex items-center gap-2">
                            <Button
                                appearance="subtle"
                                icon={<DesktopRegular />}
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
                    <div>
                        <span className="text-lg font-bold text-slate-800">
                            📦 Detalle O/C {compra?.orden_compra || ''}
                        </span>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs text-gray-500">
                            <span>{compra?.razon_social || ''}</span>
                            {compra?.ruc && <span className="text-blue-600 font-mono">RUC {compra.ruc}</span>}
                            {compra?.direccion && <span className="truncate max-w-[200px]">{compra.direccion}</span>}
                            {compra?.mes_calendario && <span>📅 {compra.mes_calendario}</span>}
                            {compra?.fecha_compra && <span>{new Date(compra.fecha_compra + 'T00:00:00').toLocaleDateString('es-PE')}</span>}
                        </div>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="p-4 space-y-6">
                {equipos.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                        <p>No se encontraron equipos registrados</p>
                    </div>
                ) : (
                    equipos.map((detalle) => (
                        <div key={detalle.id}>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge appearance="filled" color="brand" size="small">
                                    {detalle.tipo_equipo}
                                </Badge>
                                <span className="text-sm text-gray-700 font-medium">{detalle.marca} {detalle.modelo}</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                    S/{detalle.costo_unitario ? Number(detalle.costo_unitario).toFixed(2) : '—'}
                                </span>
                                <Button
                                    appearance="subtle"
                                    icon={<EditRegular />}
                                    size="small"
                                    onClick={() => openBatchEdit(detalle)}
                                    className="text-blue-600"
                                >
                                    Editar datos OC
                                </Button>
                            </div>

                            {batchEdit.open && batchEdit.detalleId === detalle.id && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3 space-y-3">
                                    <p className="text-xs font-semibold text-blue-700 uppercase">
                                        ✏️ Editar datos de la O/C
                                    </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Razón Social">
                                    <Input
                                        value={batchForm.razon_social}
                                        onChange={(e) => setBatchForm(p => ({ ...p, razon_social: e.target.value }))}
                                        placeholder="Razón social"
                                    />
                                </Field>
                                <Field label="RUC">
                                    <Input
                                        value={batchForm.ruc}
                                        onChange={(e) => setBatchForm(p => ({ ...p, ruc: e.target.value }))}
                                        placeholder="20XXXXXXXXX"
                                        maxLength={11}
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Dirección">
                                    <Input
                                        value={batchForm.direccion}
                                        onChange={(e) => setBatchForm(p => ({ ...p, direccion: e.target.value }))}
                                        placeholder="Dirección"
                                    />
                                </Field>
                                <Field label="Mes Calendario">
                                    <Input
                                        value={batchForm.mes_calendario}
                                        onChange={(e) => setBatchForm(p => ({ ...p, mes_calendario: e.target.value }))}
                                        placeholder="Ej. Enero 2026"
                                    />
                                </Field>
                            </div>
                            <Field label="Fecha Compra">
                                <Input
                                    type="date"
                                    value={batchForm.fecha_compra}
                                    onChange={(e) => setBatchForm(p => ({ ...p, fecha_compra: e.target.value }))}
                                />
                            </Field>
                            <Field label="Observaciones">
                                <Input
                                    value={batchForm.observaciones}
                                    onChange={(e) => setBatchForm(p => ({ ...p, observaciones: e.target.value }))}
                                    placeholder="Notas u observaciones"
                                />
                            </Field>
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
                                            {saving ? 'Guardando...' : 'Aplicar cambios'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <Table className="w-full mb-6">
                                <TableHeader>
                                    <TableRow>
                                        <TableHeaderCell>Serie</TableHeaderCell>
                                        <TableHeaderCell>Cód. Patrimonial</TableHeaderCell>
                                        <TableHeaderCell>Estado</TableHeaderCell>
                                        <TableHeaderCell>Asignado a</TableHeaderCell>
                                        <TableHeaderCell>Condición</TableHeaderCell>
                                        <TableHeaderCell>Especificaciones</TableHeaderCell>
                                        <TableHeaderCell>Acciones</TableHeaderCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(detalle.equipos || []).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-6 text-gray-400">
                                                No se encontraron bienes registrados para este detalle
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (detalle.equipos || []).map((equipo) => (
                                            <TableRow key={equipo.id} className="hover:bg-gray-50 transition-colors">
                                                <TableCell className="font-mono text-xs">
                                                    {equipo.serie || '—'}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {equipo.codigo_patrimonial ? (
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
                                                            {equipo.codigo_patrimonial}
                                                        </span>
                                                    ) : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        equipo.estado === 'Activo' || equipo.estado === 'Disponible'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : equipo.estado === 'Asignado'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-gray-200 text-gray-800'
                                                    }`}>
                                                        {equipo.estado}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {equipo.estado === 'Asignado' && asignacionesMap[equipo.id] ? (
                                                        <Tooltip content={`Acta: ${asignacionesMap[equipo.id].acta}`} relationship="label">
                                                            <span className="text-amber-700 font-medium cursor-default">
                                                                {asignacionesMap[equipo.id].persona}
                                                            </span>
                                                        </Tooltip>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {equipo.condicion || '—'}
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">
                                                    {[equipo.procesador, equipo.ram, equipo.almacenamiento].filter(Boolean).join(' | ') || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Tooltip content="Editar equipo" relationship="label">
                                                            <Button
                                                                appearance="subtle"
                                                                icon={<EditRegular />}
                                                                onClick={() => {
                                                                    onClose()
                                                                    onEditEquipo(equipo)
                                                                }}
                                                                size="small"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip content="Eliminar equipo" relationship="label">
                                                            <Button
                                                                appearance="subtle"
                                                                icon={<DeleteRegular />}
                                                                onClick={() => onDeleteEquipo(equipo)}
                                                                size="small"
                                                                className="text-red-500 hover:text-red-700"
                                                            />
                                                        </Tooltip>
                                                    </div>
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

export default DetalleOCEquiposDrawer
