import { useState, useEffect } from 'react'
import { Button, Drawer, DrawerHeader, DrawerHeaderTitle, DrawerBody, DrawerFooter, Card, Badge, Spinner } from '@fluentui/react-components'
import { DismissRegular, EditRegular, DeleteRegular, LaptopRegular, DesktopRegular, PrintRegular, TvRegular, PhoneTabletRegular, DesktopKeyboardRegular, ProjectionScreenRegular, DocumentRegular } from '@fluentui/react-icons'
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
    Disponible: 'success',
    Asignado: 'warning'
}

const tipoIcono = (tipo) => {
    const map = {
        Laptop: <LaptopRegular className="text-blue-600" />,
        Desktop: <DesktopKeyboardRegular className="text-orange-500" />,
        CPU: <DesktopKeyboardRegular className="text-orange-500" />,
        'All-in-One': <DesktopRegular className="text-blue-600" />,
        Tablet: <PhoneTabletRegular className="text-black" />,
        Impresora: <PrintRegular className="text-purple-500" />,
        Proyector: <ProjectionScreenRegular className="text-green-500" />,
        Monitor: <TvRegular className="text-green-500" />,
        Escáner: <DocumentRegular className="text-blue-500" />,
        Plotter: <PrintRegular className="text-purple-500" />,
        Multifuncional: <PrintRegular className="text-purple-500" />
    }
    return map[tipo] || <DocumentRegular className="text-gray-500" />
}

export default function DrawerDetalleBien({ open, onClose, bien, onEdit, onDelete }) {
    const [asignacion, setAsignacion] = useState(null)
    const [loadingAsig, setLoadingAsig] = useState(false)

    useEffect(() => {
        if (open && bien?.id && (bien.estado === 'Asignado' || bien.estado === 'Activo')) {
            setLoadingAsig(true)
            supabase
                .from('asignaciones')
                .select('*, persona:personas!fk_asignaciones_persona(*), ambiente:ambientes!fk_asignaciones_ambiente(*, piso:pisos(*))')
                .eq('bien_id', bien.id)
                .order('fecha_asignacion', { ascending: false })
                .limit(1)
                .maybeSingle()
                .then(({ data, error }) => {
                    if (error) {
                        console.error('[DrawerDetalleBien]', error)
                        return
                    }
                    if (data) setAsignacion(data)
                })
                .catch(err => console.error('[DrawerDetalleBien]', err))
                .finally(() => setLoadingAsig(false))
        } else {
            setAsignacion(null)
        }
    }, [open, bien?.id, bien?.estado])

    if (!bien) return null

    const condicionColor = CONDICION_COLOR[bien.condicion] || 'seafoam'
    const estadoColor = ESTADO_COLOR[bien.estado] || 'seafoam'

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
                            {tipoIcono(bien.tipo_equipo)} {bien.tipo_equipo || 'Bien'}
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
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{bien.tipo_equipo || '—'}</span>
                        <span className="text-sm font-semibold text-gray-800">
                            {[bien.marca, bien.modelo].filter(Boolean).join(' ') || '—'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                        <div>
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Serie</span>
                            <p className="font-mono font-medium mt-0.5">{bien.serie || '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Cód. Patrimonial</span>
                            <p className="font-mono font-medium mt-0.5">{bien.codigo_patrimonial || '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Código TI</span>
                            <p className="font-mono font-medium mt-0.5">{bien.codigo_ti || '—'}</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                        {bien.procesador && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">Procesador</span>
                                <p className="font-medium mt-0.5">{bien.procesador}</p>
                            </div>
                        )}
                        {bien.ram && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">RAM</span>
                                <p className="font-medium mt-0.5">{bien.ram}</p>
                            </div>
                        )}
                        {bien.almacenamiento && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">Almacenamiento</span>
                                <p className="font-medium mt-0.5">{bien.almacenamiento} {bien.tipo_almacenamiento || ''}</p>
                            </div>
                        )}
                        {bien.tamano_pantalla && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">Pantalla</span>
                                <p className="font-medium mt-0.5">{bien.tamano_pantalla}"</p>
                            </div>
                        )}
                        {bien.direccion_mac && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">MAC</span>
                                <p className="font-mono font-medium mt-0.5">{bien.direccion_mac}</p>
                            </div>
                        )}
                        {bien.sistema_operativo && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">S.O.</span>
                                <p className="font-medium mt-0.5">{bien.sistema_operativo}</p>
                            </div>
                        )}
                        {bien.anio_compra && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">Año Compra</span>
                                <p className="font-medium mt-0.5">{bien.anio_compra}</p>
                            </div>
                        )}
                        {bien.valor_compra && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">Valor Compra</span>
                                <p className="font-medium mt-0.5">S/ {bien.valor_compra}</p>
                            </div>
                        )}
                        {bien.proveedor && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">Proveedor</span>
                                <p className="font-medium mt-0.5">{bien.proveedor}</p>
                            </div>
                        )}
                        {bien.orden_compra && (
                            <div>
                                <span className="text-gray-400 uppercase tracking-wider text-[10px]">O/C</span>
                                <p className="font-medium mt-0.5">{bien.orden_compra}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Estado y Condición */}
                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Estado</div>
                    <div className="flex items-center gap-3">
                        <Badge appearance="filled" color={estadoColor}>{bien.estado}</Badge>
                        <Badge appearance="outline" color={condicionColor}>{bien.condicion}</Badge>
                    </div>
                </Card>

                {/* Asignación */}
                {(bien.estado === 'Asignado' || bien.estado === 'Activo') && (
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
                {bien.observaciones && (
                    <Card appearance="outline" className="border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Observaciones</div>
                        <p className="text-sm text-gray-700">{bien.observaciones}</p>
                    </Card>
                )}
            </DrawerBody>

            <DrawerFooter className="border-t py-4 px-6 bg-gray-50 flex justify-between">
                <Button appearance="subtle" onClick={onClose}>Cerrar</Button>
                <div className="flex gap-2">
                    <Button
                        appearance="secondary"
                        icon={<DeleteRegular />}
                        onClick={() => onDelete(bien)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                        Eliminar
                    </Button>
                    <Button
                        appearance="primary"
                        icon={<EditRegular />}
                        onClick={() => onEdit(bien)}
                    >
                        Editar
                    </Button>
                </div>
            </DrawerFooter>
        </Drawer>
    )
}
