import { useState, useEffect } from 'react'
import { Button, Drawer, DrawerHeader, DrawerHeaderTitle, DrawerBody, DrawerFooter, Card, Badge, Spinner } from '@fluentui/react-components'
import { DismissRegular, EditRegular, DeleteRegular, DesktopRegular } from '@fluentui/react-icons'
import { supabase } from '../../lib/supabaseClient'

const CONDICION_COLOR = {
    Bueno: 'success',
    Regular: 'warning',
    Malo: 'danger',
    Chatarra: 'danger'
}

const ESTADO_COLOR = {
    Activo: 'success',
    Inactivo: 'danger',
    'Dado de Baja': 'danger',
    Disponible: 'success'
}

export default function DrawerDetalleEquipo({ open, onClose, equipo, onEdit, onDelete }) {
    const [asignacion, setAsignacion] = useState(null)
    const [loadingAsig, setLoadingAsig] = useState(false)

    useEffect(() => {
        if (open && equipo?.id && (equipo.estado === 'Asignado' || equipo.estado === 'Activo')) {
            setLoadingAsig(true)
                supabase
                    .from('asignaciones')
                    .select(`*, persona:personas!fk_asignaciones_persona(*), ambiente:ambientes!fk_asignaciones_ambiente(*, piso:pisos(*))`)
                    .eq('bien_id', equipo.id)
                    .order('fecha_asignacion', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                .then(({ data, error }) => {
                    if (error) {
                        console.error('[DrawerDetalleEquipo]', error)
                        return
                    }
                    if (data) setAsignacion(data)
                })
                .catch(err => console.error('[DrawerDetalleEquipo]', err))
                .finally(() => setLoadingAsig(false))
        } else {
            setAsignacion(null)
        }
    }, [open, equipo?.id, equipo?.estado])

    if (!equipo) return null

    const condicionColor = CONDICION_COLOR[equipo.condicion] || 'seafoam'
    const estadoColor = ESTADO_COLOR[equipo.estado] || 'seafoam'

    return (
        <Drawer
            position="end"
            open={open}
            onOpenChange={(_, { open }) => { if (!open) onClose() }}
            style={{ width: '100%', maxWidth: '600px' }}
        >
            <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} />}>
                    <div>
                        <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <DesktopRegular className="text-blue-600" /> Detalle del Equipo
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">Información completa del bien patrimonial</p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="p-6 space-y-4 overflow-y-auto">
                {/* Información General */}
                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Información General</div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{equipo.tipo_equipo || '—'}</span>
                        <span className="text-sm font-semibold text-gray-800">
                            {[equipo.marca, equipo.modelo].filter(Boolean).join(' ') || '—'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                        <div>
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Serie</span>
                            <p className="font-mono font-medium mt-0.5">{equipo.serie || '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Cód. Patrimonial</span>
                            <p className="font-mono font-medium mt-0.5">{equipo.codigo_patrimonial || '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Código TI</span>
                            <p className="font-mono font-medium mt-0.5">{equipo.codigo_ti || '—'}</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                        {equipo.procesador && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">Procesador</span>
                                <p className="font-medium mt-0.5">{equipo.procesador}</p>
                            </div>
                        )}
                        {equipo.ram && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">RAM</span>
                                <p className="font-medium mt-0.5">{equipo.ram}</p>
                            </div>
                        )}
                        {equipo.almacenamiento && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">Almacenamiento</span>
                                <p className="font-medium mt-0.5">{equipo.almacenamiento} {equipo.tipo_almacenamiento || ''}</p>
                            </div>
                        )}
                        {equipo.tamano_pantalla && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">Pantalla</span>
                                <p className="font-medium mt-0.5">{equipo.tamano_pantalla}"</p>
                            </div>
                        )}
                        {equipo.direccion_mac && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">MAC</span>
                                <p className="font-mono font-medium mt-0.5">{equipo.direccion_mac}</p>
                            </div>
                        )}
                        {equipo.sistema_operativo && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">S.O.</span>
                                <p className="font-medium mt-0.5">{equipo.sistema_operativo}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Estado y Condición */}
                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Estado</div>
                    <div className="flex items-center gap-3">
                        <Badge appearance="filled" color={estadoColor}>{equipo.estado}</Badge>
                        <Badge appearance="outline" color={condicionColor}>{equipo.condicion}</Badge>
                    </div>
                </Card>

                {/* Asignación */}
                {(equipo.estado === 'Asignado' || equipo.estado === 'Activo') && (
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
                                        {asignacion.persona?.cargo && (
                                            <p className="text-xs text-gray-500">{asignacion.persona.cargo}</p>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-xs">N° Acta</span>
                                        <p className="font-medium mt-0.5">{asignacion.numero_acta || '—'}</p>
                                    </div>
                                </div>
                                {asignacion.ambiente && (
                                    <div>
                                        <span className="text-gray-400 text-xs">Ubicación</span>
                                        <p className="font-medium mt-0.5">
                                            {asignacion.ambiente.nombre}
                                            {asignacion.ambiente.piso ? ` · Piso ${asignacion.ambiente.piso.nombre || asignacion.ambiente.piso.numero}` : ''}
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
                            <p className="text-sm text-gray-400">Sin asignación activa</p>
                        )}
                    </Card>
                )}

                {/* Observaciones del bien */}
                {equipo.observaciones && (
                    <Card appearance="outline" className="border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Observaciones</div>
                        <p className="text-sm text-gray-700">{equipo.observaciones}</p>
                    </Card>
                )}
            </DrawerBody>

            <DrawerFooter className="border-t py-4 px-6 bg-gray-50 flex justify-between">
                <Button appearance="subtle" onClick={onClose}>Cerrar</Button>
                <div className="flex gap-2">
                    <Button
                        appearance="secondary"
                        icon={<DeleteRegular />}
                        onClick={() => onDelete(equipo)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                        Eliminar
                    </Button>
                    <Button
                        appearance="primary"
                        icon={<EditRegular />}
                        onClick={() => onEdit(equipo)}
                    >
                        Editar
                    </Button>
                </div>
            </DrawerFooter>
        </Drawer>
    )
}
