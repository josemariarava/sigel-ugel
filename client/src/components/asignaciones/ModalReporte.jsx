import { DismissRegular } from '@fluentui/react-icons'
import { Button, Badge } from '@fluentui/react-components'

export default function ModalReporte({
    openReporteModal, setOpenReporteModal,
    reporteData, fechasReporte
}) {
    if (!openReporteModal) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-lg">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-blue-50/40">
                    <div>
                        <h3 className="font-bold text-lg">📊 Reporte de Movimientos</h3>
                        <p className="text-xs text-gray-500">{fechasReporte.inicio} al {fechasReporte.fin}</p>
                    </div>
                    <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenReporteModal(false)} />
                </div>
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {reporteData.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No hay movimientos en este período</div>
                    ) : (
                        <div className="space-y-3">
                            {reporteData.map((mov) => (
                                <div key={mov.id} className="border-b pb-3 mb-3 last:border-0">
                                    <div className="flex justify-between items-start">
                                        <Badge appearance="filled" color="brand">{mov.tipo_movimiento?.nombre}</Badge>
                                        <span className="text-xs text-gray-400">{mov.fecha_movimiento}</span>
                                    </div>
                                    <p className="text-sm font-medium mt-1">{mov.bien?.tipo_equipo} - {mov.bien?.codigo_patrimonial}</p>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {mov.persona_origen && <span>De: {mov.persona_origen?.nombres} {mov.persona_origen?.apellidos}</span>}
                                        {mov.persona_destino && <span className="ml-2">→ A: {mov.persona_destino?.nombres} {mov.persona_destino?.apellidos}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
