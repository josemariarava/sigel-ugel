import { DismissRegular, PersonRegular, BuildingRegular, DocumentPdfRegular } from '@fluentui/react-icons'
import {
    Button,
    Drawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerBody,
    DrawerFooter,
    Badge
} from '@fluentui/react-components'

export default function DrawerDetalle({
    openDetalleModal, setOpenDetalleModal,
    selectedPersonaDetalle, bienesPorPersona,
    generarActaCargo, personas
}) {
    return (
        <Drawer position="end" open={openDetalleModal} onOpenChange={(_, data) => setOpenDetalleModal(data.open)} size='medium'>
            <DrawerHeader className="border-b bg-gradient-to-r from-indigo-50 to-white">
                <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenDetalleModal(false)} />}>
                    <div>
                        <span className="text-lg font-bold text-slate-800">
                            {selectedPersonaDetalle?.esUbicacion ? '📍 Bienes por Ubicación' : '👤 Bienes Asignados'}
                        </span>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>
            <DrawerBody className="p-6 my-6">
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">{selectedPersonaDetalle?.esUbicacion ? 'Ubicación' : 'Responsable'}</p>
                    <p className="text-lg font-bold text-gray-800">{selectedPersonaDetalle?.nombre}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                        {selectedPersonaDetalle?.esUbicacion && selectedPersonaDetalle?.ambienteData && (
                            <>
                                {selectedPersonaDetalle.ambienteData.piso && (
                                    <span className="flex items-center gap-1">
                                        <BuildingRegular style={{ fontSize: '12px' }} className="text-gray-400" />
                                        {selectedPersonaDetalle.ambienteData.piso.nombre || `Piso ${selectedPersonaDetalle.ambienteData.piso.numero}`}
                                    </span>
                                )}
                                {selectedPersonaDetalle.ambienteData.area && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                        {selectedPersonaDetalle.ambienteData.area.nombre}
                                    </span>
                                )}
                            </>
                        )}
                        <span>Total: {bienesPorPersona.length} bienes</span>
                    </div>
                </div>
                {bienesPorPersona.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No hay bienes asignados</div>
                ) : (
                    <div className="space-y-3">
                        {bienesPorPersona.map((asig) => (
                            <div key={asig.id} className="bg-slate-50 rounded-xl p-4 border hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{asig.bien?.tipo_equipo}</p>
                                        <p className="text-xs text-gray-500">{asig.bien?.marca} {asig.bien?.modelo}</p>
                                        <p className="text-xs font-mono text-gray-400 mt-1">Código: {asig.bien?.codigo_patrimonial}</p>
                                    </div>
                                    <Badge appearance="filled" color="success">{asig.estado_asignacion}</Badge>
                                </div>
                                <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                                    <span>📍 {asig.ambiente?.nombre}</span>
                                    <span>📅 {asig.fecha_asignacion}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DrawerBody>
            <DrawerFooter className="border-t pt-4 pb-4 bg-gray-50">
                {!selectedPersonaDetalle?.esUbicacion && (
                    <Button appearance="primary" icon={<DocumentPdfRegular />} onClick={() => generarActaCargo(selectedPersonaDetalle?.id, selectedPersonaDetalle?.nombre?.split(' ')[0], selectedPersonaDetalle?.nombre?.split(' ')[1] || '', personas.find(p => p.id === selectedPersonaDetalle?.id))} disabled={bienesPorPersona.length === 0}>
                        Generar Acta de Cargo
                    </Button>
                )}
            </DrawerFooter>
        </Drawer>
    )
}
