import { Button, Drawer, DrawerHeader, DrawerHeaderTitle, DrawerBody, DrawerFooter, Card } from '@fluentui/react-components'
import { DismissRegular, OpenRegular } from '@fluentui/react-icons'

export default function DrawerDetallesToners({
    open,
    onClose,
    data,
    personas,
}) {
    if (!data) return null

    const entregadoPorPersona = personas.find(p => p.id === data.entregado_por)
    const tieneActa = !!data.acta_url

    const calcularDuracion = (asig) => {
        if (!asig.fecha_asignacion) return '—'
        const inicio = new Date(asig.fecha_asignacion)
        const fin = asig.fecha_terminado ? new Date(asig.fecha_terminado) : new Date()
        const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24))
        if (dias < 1) return 'Menos de 1 día'
        if (dias === 1) return '1 día'
        return `${dias} días`
    }

    const estadoBadge = (estado) => {
        const map = {
            Activo: 'bg-blue-100 text-blue-800',
            Terminado: 'bg-green-100 text-green-800',
            Devuelto: 'bg-amber-100 text-amber-800',
        }
        return map[estado] || 'bg-gray-100 text-gray-800'
    }

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
                        <span className="text-lg font-bold text-slate-800">Detalles de la Asignación</span>
                        <p className="text-xs text-gray-500 mt-0.5">Información completa de la entrega del tóner</p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="p-6 space-y-5 overflow-y-auto">
                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tóner</div>
                    {data.toner && (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-800">
                                    {data.toner.marca} {data.toner.modelo}
                                </span>
                                {data.toner.color_toner && (
                                    <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                                        {data.toner.color_toner}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs text-gray-600">
                                <div>
                                    <span className="text-gray-400 uppercase tracking-wider text-[10px]">Serie</span>
                                    <p className="font-mono">{data.toner.serie || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 uppercase tracking-wider text-[10px]">Lote</span>
                                    <p className="font-mono">{data.toner.lote || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 uppercase tracking-wider text-[10px]">Vencimiento</span>
                                    <p>{data.toner.fecha_vencimiento || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 uppercase tracking-wider text-[10px]">Ubicación</span>
                                    <p>{data.toner.ubicacion_almacen || '—'}</p>
                                </div>
                            </div>
                        </>
                    )}
                    {!data.toner && <p className="text-sm text-gray-400">Sin datos del tóner</p>}
                </Card>

                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Responsables</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400 text-xs">Entregado por</span>
                            <p className="font-medium">
                                {entregadoPorPersona
                                    ? `${entregadoPorPersona.apellidos}, ${entregadoPorPersona.nombres}`
                                    : data.entregado_por || '—'}
                            </p>
                            {entregadoPorPersona?.cargo && (
                                <p className="text-xs text-gray-500">{entregadoPorPersona.cargo}</p>
                            )}
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs">Recibido por</span>
                            <p className="font-medium">
                                {data.persona
                                    ? `${data.persona.apellidos}, ${data.persona.nombres}`
                                    : '—'}
                            </p>
                            {data.persona?.cargo && (
                                <p className="text-xs text-gray-500">{data.persona.cargo}</p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ubicación</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400 text-xs">Impresora destino</span>
                            <p className="font-medium">
                                {data.impresora
                                    ? `${data.impresora.marca} ${data.impresora.modelo}${data.impresora.serie ? ` (${data.impresora.serie})` : ''}`
                                    : 'No especificada'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs">Ambiente</span>
                            <p className="font-medium">
                                {data.ambiente
                                    ? `${data.ambiente.nombre} (${data.ambiente.codigo})`
                                    : 'No especificado'}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Documentación</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                            <span className="text-gray-400 text-xs">Fecha de asignación</span>
                            <p className="font-medium">{data.fecha_asignacion || '—'}</p>
                        </div>
                        {data.fecha_terminado && (
                            <div>
                                <span className="text-gray-400 text-xs">Fecha de terminado</span>
                                <p className="font-medium">{data.fecha_terminado}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-400 text-xs">Documento referencia</span>
                            <p className="font-medium">{data.documento_referencia || '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs">N° Acta</span>
                            <p className="font-medium">{data.numero_acta || '—'}</p>
                        </div>
                    </div>
                    {data.observaciones && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-gray-400 text-xs">Observaciones</span>
                            <p className="text-sm mt-0.5 text-gray-700">{data.observaciones}</p>
                        </div>
                    )}
                </Card>

                <Card appearance="outline" className="border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Estado</div>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge(data.estado)}`}>
                                {data.estado || 'Activo'}
                            </span>
                            <span className="ml-3 text-xs text-gray-500">
                                ({calcularDuracion(data)} de duración)
                            </span>
                        </div>
                        {tieneActa && (
                            <a
                                href={`${data.acta_url}?t=${Date.now()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    size="small"
                                    appearance="outline"
                                    icon={<OpenRegular />}
                                    className="text-blue-600"
                                >
                                    Abrir Acta
                                </Button>
                            </a>
                        )}
                    </div>
                </Card>
            </DrawerBody>

            <DrawerFooter className="border-t py-4 px-6 bg-gray-50 flex justify-end">
                <Button appearance="secondary" onClick={onClose}>
                    Cerrar
                </Button>
            </DrawerFooter>
        </Drawer>
    )
}
