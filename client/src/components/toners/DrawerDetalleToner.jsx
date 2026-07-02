import { useState, useEffect } from 'react'
import { Button, Drawer, DrawerHeader, DrawerHeaderTitle, DrawerBody, DrawerFooter, Card, Badge, Spinner } from '@fluentui/react-components'
import { DismissRegular, EditRegular, DeleteRegular, CartRegular } from '@fluentui/react-icons'
import { supabase } from '../../lib/supabaseClient'

const ESTADO_COLOR = {
    Disponible: 'success',
    Activo: 'success',
    Asignado: 'warning',
    Agotado: 'danger'
}

export default function DrawerDetalleToner({ open, onClose, toner, onEdit, onDelete }) {
    const [asignacion, setAsignacion] = useState(null)
    const [loadingAsig, setLoadingAsig] = useState(false)

    useEffect(() => {
        if (open && toner?.id && toner.estado === 'Asignado') {
            setLoadingAsig(true)
                supabase
                    .from('asignacion_toners')
                    .select(`*, persona:personas!asignacion_toners_persona_id_fkey(*), impresora:bienes!asignacion_toners_impresora_id_fkey(*)`)
                    .eq('toner_id', toner.id)
                    .order('fecha_asignacion', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                .then(({ data, error }) => {
                    if (!error && data) setAsignacion(data)
                })
                .catch(err => console.error('[DrawerDetalleToner]', err))
                .finally(() => setLoadingAsig(false))
        } else {
            setAsignacion(null)
        }
    }, [open, toner?.id, toner?.estado])

    if (!toner) return null

    const estadoColor = ESTADO_COLOR[toner.estado] || 'seafoam'
    const estadoLabel = toner.estado === 'Activo' ? 'Disponible' : toner.estado
    const vencido = toner.fecha_vencimiento && new Date(toner.fecha_vencimiento) < new Date()

    return (
        <Drawer
            position="end"
            open={open}
            onOpenChange={(_, { open }) => { if (!open) onClose() }}
            style={{ width: '100%', maxWidth: '600px' }}
        >
            <DrawerHeader className="border-b bg-gradient-to-r from-teal-50 to-white">
                <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} />}>
                    <div>
                        <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <CartRegular className="text-teal-600" /> Detalle del Tóner
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">Información completa del bien consumible</p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="p-6 space-y-4 overflow-y-auto">
                {/* Información General */}
                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Información General</div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-800">
                            {[toner.marca, toner.modelo].filter(Boolean).join(' ') || '—'}
                        </span>
                        {toner.color_toner && (
                            <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                                {toner.color_toner}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
                        <div>
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Serie</span>
                            <p className="font-mono font-medium mt-0.5">{toner.serie || '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Lote</span>
                            <p className="font-mono font-medium mt-0.5">{toner.lote || '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Rendimiento</span>
                            <p className="font-medium mt-0.5">{toner.rendimiento ? `${toner.rendimiento} págs.` : '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Proveedor</span>
                            <p className="font-medium mt-0.5">{toner.proveedor || '—'}</p>
                        </div>
                    </div>
                </Card>

                {/* Almacén */}
                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Almacén</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400 text-xs">Ubicación</span>
                            <p className="font-medium mt-0.5">{toner.ubicacion_almacen || 'No especificada'}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs">Fecha de Vencimiento</span>
                            <p className={`font-medium mt-0.5 ${vencido ? 'text-red-500' : ''}`}>
                                {toner.fecha_vencimiento || '—'}
                                {vencido && <span className="text-[10px] text-red-500 ml-1">(Vencido)</span>}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Estado */}
                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Estado</div>
                    <div className="flex items-center gap-2">
                        <Badge appearance="filled" color={estadoColor}>{estadoLabel}</Badge>
                    </div>
                </Card>

                {/* Códigos */}
                {(toner.codigo_patrimonial || toner.codigo_ti) && (
                    <Card appearance="outline" className="border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Códigos</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {toner.codigo_patrimonial && (
                                <div>
                                    <span className="text-gray-400 text-xs">Código Patrimonial</span>
                                    <p className="font-mono font-medium mt-0.5">{toner.codigo_patrimonial}</p>
                                </div>
                            )}
                            {toner.codigo_ti && (
                                <div>
                                    <span className="text-gray-400 text-xs">Código TI</span>
                                    <p className="font-mono font-medium mt-0.5">{toner.codigo_ti}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Asignación */}
                {toner.estado === 'Asignado' && (
                    <Card appearance="outline" className="border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Asignación</div>
                        {loadingAsig ? (
                            <Spinner size="tiny" label="Cargando asignación..." labelPosition="after" />
                        ) : asignacion ? (
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-gray-400 text-xs">Asignado a</span>
                                        <p className="font-medium mt-0.5">
                                            {asignacion.persona
                                                ? `${asignacion.persona.apellidos}, ${asignacion.persona.nombres}`
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs">N° Acta</span>
                                        <p className="font-medium mt-0.5">{asignacion.numero_acta || '—'}</p>
                                    </div>
                                </div>
                                {asignacion.impresora && (
                                    <div>
                                        <span className="text-gray-400 text-xs">Impresora destino</span>
                                        <p className="font-medium mt-0.5">
                                            {asignacion.impresora.marca} {asignacion.impresora.modelo}
                                            {asignacion.impresora.serie ? ` (${asignacion.impresora.serie})` : ''}
                                        </p>
                                    </div>
                                )}
                                {asignacion.fecha_asignacion && (
                                    <div>
                                        <span className="text-gray-400 text-xs">Fecha de asignación</span>
                                        <p className="font-medium mt-0.5">{asignacion.fecha_asignacion}</p>
                                    </div>
                                )}
                                {asignacion.observaciones && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-gray-400 text-xs">Observaciones</span>
                                        <p className="text-sm mt-0.5 text-gray-700">{asignacion.observaciones}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No se encontró asignación activa</p>
                        )}
                    </Card>
                )}

                {/* Observaciones del bien */}
                {toner.observaciones && (
                    <Card appearance="outline" className="border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Observaciones del bien</div>
                        <p className="text-sm text-gray-700">{toner.observaciones}</p>
                    </Card>
                )}
            </DrawerBody>

            <DrawerFooter className="border-t py-4 px-6 bg-gray-50 flex justify-between">
                <Button appearance="subtle" onClick={onClose}>Cerrar</Button>
                <div className="flex gap-2">
                    <Button
                        appearance="secondary"
                        icon={<DeleteRegular />}
                        onClick={() => onDelete(toner)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                        Eliminar
                    </Button>
                    <Button
                        appearance="primary"
                        icon={<EditRegular />}
                        onClick={() => onEdit(toner)}
                    >
                        Editar
                    </Button>
                </div>
            </DrawerFooter>
        </Drawer>
    )
}
