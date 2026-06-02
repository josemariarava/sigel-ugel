import { DismissRegular } from '@fluentui/react-icons'
import { Button } from '@fluentui/react-components'

export default function ModalHistorialToners({
    openHistorialModal, setOpenHistorialModal,
    historialAsignaciones,
}) {
    if (!openHistorialModal) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
                <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-white flex justify-between items-center">
                    <h3 className="text-lg font-bold text-purple-800">📜 Línea de Tiempo</h3>
                    <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenHistorialModal(false)} />
                </div>
                <div className="p-6 overflow-y-auto max-h-[65vh]">
                    {(() => {
                        const now = Date.now()
                        const activeThreshold = new Date(now - 120 * 24 * 60 * 60 * 1000)
                        const expiryWarning = new Date(now + 30 * 24 * 60 * 60 * 1000)

                        if (historialAsignaciones.length === 0) {
                            return <div className="text-center py-8 text-gray-400">No hay historial disponible</div>
                        }

                        return (
                            <div className="relative">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                                {historialAsignaciones.map((event, idx) => {
                                    const isRecepcion = event.tipo === 'recepcion'
                                    const isAsignacion = event.tipo === 'asignacion'
                                    const isTerminado = event.tipo === 'terminado'
                                    const isLiberado = event.tipo === 'liberado'
                                    const isEliminado = isAsignacion && event.metadata?.isDeleted

                                    let color, icon, borderColor, bgColor

                                    if (isRecepcion) {
                                        color = 'bg-emerald-500'; icon = '📦'; borderColor = 'border-emerald-200'; bgColor = 'bg-emerald-50'
                                    } else if (isAsignacion) {
                                        if (isEliminado) {
                                            color = 'bg-red-400'; icon = '👤'; borderColor = 'border-red-200'; bgColor = 'bg-red-50'
                                        } else {
                                            color = 'bg-blue-500'; icon = '👤'; borderColor = 'border-blue-200'; bgColor = 'bg-blue-50'
                                        }
                                    } else if (isTerminado) {
                                        color = 'bg-amber-500'; icon = '✅'; borderColor = 'border-amber-200'; bgColor = 'bg-amber-50'
                                    } else if (isLiberado) {
                                        color = 'bg-orange-500'; icon = '🔄'; borderColor = 'border-orange-200'; bgColor = 'bg-orange-50'
                                    } else if (event.tipo === 'reabastecimiento') {
                                        color = 'bg-purple-500'; icon = '📥'; borderColor = 'border-purple-200'; bgColor = 'bg-purple-50'
                                    } else {
                                        color = 'bg-gray-500'; icon = '🔄'; borderColor = 'border-gray-200'; bgColor = 'bg-gray-50'
                                    }

                                    const formatFecha = (f) => {
                                        if (!f) return ''
                                        return new Date(f).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
                                    }

                                    const fechaEvento = new Date(event.fecha)
                                    const diasActivo = Math.floor((now - fechaEvento.getTime()) / (1000 * 60 * 60 * 24))
                                    const esVencido = new Date(event.metadata?.vencimiento) < new Date()
                                    const porVencer = !esVencido && new Date(event.metadata?.vencimiento) < expiryWarning

                                    return (
                                        <div key={event.id || idx} className="relative flex gap-4 pb-6 last:pb-0">
                                            <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs shadow-md`}>
                                                <span>{icon}</span>
                                            </div>

                                            <div className={`flex-1 border rounded-lg p-3 ${borderColor} ${bgColor}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-sm">{event.descripcion}</p>
                                                        {event.detalle && (
                                                            <p className="text-xs text-gray-500 mt-0.5">{event.detalle}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                        {formatFecha(event.fecha)}
                                                    </span>
                                                </div>

                                                {isEliminado && (
                                                    <div className="mt-2">
                                                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 font-medium">
                                                            ❌ Esta asignación fue eliminada (no terminada)
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {event.metadata?.acta && (
                                                        <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                            Acta: {event.metadata.acta}
                                                        </span>
                                                    )}
                                                    {event.metadata?.numero_acta && !event.metadata?.acta && (
                                                        <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                            Acta: {event.metadata.numero_acta}
                                                        </span>
                                                    )}

                                                    {(event.metadata?.doc || event.metadata?.documento_referencia) && (
                                                        <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                            Doc: {event.metadata.doc || event.metadata.documento_referencia}
                                                        </span>
                                                    )}

                                                    {(event.metadata?.ambienteObj || event.metadata?.asignacion?.ambiente) && (
                                                        <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                            📍 {event.metadata.ambienteObj?.nombre || event.metadata.asignacion.ambiente?.nombre}
                                                        </span>
                                                    )}

                                                    {(event.metadata?.impresoraObj || event.metadata?.asignacion?.impresora) && (
                                                        <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                            🖨️ {(event.metadata.impresoraObj?.marca || '') + ' ' + (event.metadata.impresoraObj?.modelo || event.metadata.asignacion?.impresora?.modelo || '')}
                                                        </span>
                                                    )}

                                                    {event.metadata?.observaciones && (
                                                        <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-400 italic">
                                                            "{event.metadata.observaciones}"
                                                        </span>
                                                    )}

                                                    {isAsignacion && !isEliminado && event.metadata?.asignacion?.estado === 'Activo' && fechaEvento < activeThreshold && (
                                                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 font-medium">
                                                            ⚠️ Asignación prolongada ({diasActivo} días)
                                                        </span>
                                                    )}

                                                    {isTerminado && event.metadata?.asignacion?.duracion_dias && (
                                                        <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                            ⏱️ Duración: {event.metadata.asignacion.duracion_dias} días
                                                        </span>
                                                    )}

                                                    {isRecepcion && event.metadata?.serie && (
                                                        <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                            Serie: {event.metadata.serie}
                                                        </span>
                                                    )}
                                                </div>

                                                {isRecepcion && event.metadata?.vencimiento && (
                                                    <div className="mt-2">
                                                        {esVencido ? (
                                                            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 font-medium">
                                                                ⚠️ VENCIDO: {formatFecha(event.metadata.vencimiento)}
                                                            </span>
                                                        ) : porVencer ? (
                                                            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200 font-medium">
                                                                ⏳ Por vencer: {formatFecha(event.metadata.vencimiento)}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}
