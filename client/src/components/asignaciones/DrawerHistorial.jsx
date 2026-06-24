import {
    DismissRegular,
    BoxRegular,
    CheckmarkCircleRegular,
    ArrowSwapRegular,
    ArrowReplyRegular,
    WarningRegular,
    HistoryRegular,
    CalendarRegular,
    PersonRegular,
    LocationRegular,
    DocumentPdfRegular
} from '@fluentui/react-icons'
import {
    Button,
    Drawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerBody,
    DrawerFooter
} from '@fluentui/react-components'

export default function DrawerHistorial({
    openHistorialModal, setOpenHistorialModal,
    historialMovimientos, loadingHistorial, historialBienInfo,
    areas
}) {
    return (
        <Drawer position="end" open={openHistorialModal} onOpenChange={(_, data) => setOpenHistorialModal(data.open)} size='medium'>
            <DrawerHeader className="border-b border-gray-100 bg-purple-50/40">
                <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenHistorialModal(false)} />}>
                    <div className="flex items-center gap-3">
                        {historialBienInfo && (
                            <div className="w-10 h-10 rounded-lg bg-purple-50/50 flex items-center justify-center shrink-0">
                                <BoxRegular className="text-purple-600" style={{ fontSize: '20px' }} />
                            </div>
                        )}
                        <div>
                            <span className="text-lg font-bold text-slate-800">
                                {historialBienInfo ? `${historialBienInfo.tipo_equipo || 'Bien'}` : 'Historial de Movimientos'}
                            </span>
                            {historialBienInfo && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {historialBienInfo.marca && historialBienInfo.modelo
                                        ? `${historialBienInfo.marca} ${historialBienInfo.modelo}`
                                        : historialBienInfo.marca || historialBienInfo.modelo || ''}
                                    {historialBienInfo.codigo_patrimonial && ` · ${historialBienInfo.codigo_patrimonial}`}
                                    {historialBienInfo.serie && ` · S/N: ${historialBienInfo.serie}`}
                                </p>
                            )}
                            {!historialBienInfo && <p className="text-xs text-gray-500 mt-0.5">Trazabilidad completa del bien</p>}
                        </div>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>
            <DrawerBody className="p-0">
                {loadingHistorial ? (
                    <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                ) : historialMovimientos.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No hay movimientos registrados para este bien</div>
                ) : (
                    <div className="relative px-6 py-6">
                        {historialMovimientos.map((mov, index) => {
                            const tipo = mov.tipo_movimiento?.nombre || ''
                            const esActual = index === historialMovimientos.length - 1

                            const config = {
                                'Asignación Inicial': { icon: CheckmarkCircleRegular, bg: 'bg-green-500', line: 'border-green-300', label: 'Asignación Inicial', labelBg: 'bg-green-100 text-green-800' },
                                Traslado: { icon: ArrowSwapRegular, bg: 'bg-blue-500', line: 'border-blue-300', label: 'Traslado', labelBg: 'bg-blue-100 text-blue-800' },
                                Devolución: { icon: ArrowReplyRegular, bg: 'bg-amber-500', line: 'border-amber-300', label: 'Devolución', labelBg: 'bg-amber-100 text-amber-800' },
                                'Baja Definitiva': { icon: WarningRegular, bg: 'bg-red-500', line: 'border-red-300', label: 'Baja Definitiva', labelBg: 'bg-red-100 text-red-800' },
                            }
                            const cfg = config[tipo] || { icon: HistoryRegular, bg: 'bg-gray-500', line: 'border-gray-300', label: tipo || 'Movimiento', labelBg: 'bg-gray-100 text-gray-800' }
                            const Icon = cfg.icon

                            return (
                                <div key={mov.id} className="relative flex gap-5 pb-8 last:pb-0">
                                    {index < historialMovimientos.length - 1 && (
                                        <div className={`absolute left-[17px] top-8 bottom-0 w-0.5 bg-gray-200 ${index === 0 ? 'h-full' : ''}`}></div>
                                    )}
                                    <div className="flex flex-col items-center shrink-0 pt-1">
                                        <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center text-white shadow-md ring-2 ring-white ${esActual ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}>
                                            <Icon style={{ fontSize: '16px' }} />
                                        </div>
                                    </div>
                                    <div className={`flex-1 bg-white rounded-xl border p-4 shadow-sm ${esActual ? 'ring-1 ring-blue-300 border-blue-200' : 'border-gray-100'}`}>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.labelBg}`}>
                                                    {cfg.label}
                                                </span>
                                                {esActual && (
                                                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-full border border-blue-100">
                                                        Actual
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 shrink-0">
                                                <CalendarRegular style={{ fontSize: '12px' }} /> {mov.fecha_movimiento}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                            {mov.persona_origen && (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <PersonRegular style={{ fontSize: '14px' }} className="text-gray-400 shrink-0" />
                                                    <span className="text-xs text-gray-400 font-medium">De:</span>
                                                    <span className="text-gray-700">{mov.persona_origen.nombres} {mov.persona_origen.apellidos}</span>
                                                    {mov.ambiente_origen && (
                                                        <span className="text-xs text-gray-400">
                                                            ({mov.ambiente_origen.nombre}
                                                            {(() => {
                                                                const a = areas.find(x => x.id === mov.ambiente_origen.area_id)
                                                                return a ? <span className="text-blue-500"> — {a.nombre}</span> : null
                                                            })()})
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {mov.persona_destino && (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <ArrowSwapRegular style={{ fontSize: '14px' }} className="text-blue-500 shrink-0" />
                                                    <span className="text-xs text-blue-600 font-medium">A:</span>
                                                    <span className="text-gray-700 font-medium">{mov.persona_destino.nombres} {mov.persona_destino.apellidos}</span>
                                                    {mov.ambiente_destino && (
                                                        <span className="text-xs text-gray-400">
                                                            ({mov.ambiente_destino.nombre}
                                                            {(() => {
                                                                const a = areas.find(x => x.id === mov.ambiente_destino.area_id)
                                                                return a ? <span className="text-blue-500"> — {a.nombre}</span> : null
                                                            })()})
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {!mov.persona_origen && !mov.persona_destino && mov.ambiente_destino && (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <LocationRegular style={{ fontSize: '14px' }} className="text-gray-400 shrink-0" />
                                                    <span className="text-xs text-gray-400 font-medium">Ubicación:</span>
                                                    <span className="text-gray-700">{mov.ambiente_destino.nombre}
                                                        {(() => {
                                                            const a = areas.find(x => x.id === mov.ambiente_destino.area_id)
                                                            return a ? <span className="text-blue-500"> — {a.nombre}</span> : null
                                                        })()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {(mov.motivo || mov.documento_referencia || mov.observaciones) && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                                                {mov.motivo && (
                                                    <p className="text-xs text-gray-500">
                                                        <span className="font-medium text-gray-400">Motivo:</span> {mov.motivo}
                                                    </p>
                                                )}
                                                {mov.documento_referencia && (
                                                    <p className="text-xs text-blue-600 flex items-center gap-1">
                                                        <DocumentPdfRegular style={{ fontSize: '12px' }} /> {mov.documento_referencia}
                                                    </p>
                                                )}
                                                {mov.observaciones && (
                                                    <p className="text-xs text-gray-400 italic">{mov.observaciones}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </DrawerBody>
            <DrawerFooter className="border-t border-gray-100 pt-4 pb-4">
                <Button size="small" appearance="secondary" onClick={() => setOpenHistorialModal(false)}>Cerrar</Button>
            </DrawerFooter>
        </Drawer>
    )
}
