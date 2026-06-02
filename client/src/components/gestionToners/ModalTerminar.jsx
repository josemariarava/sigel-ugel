import { Button, Field } from '@fluentui/react-components'

export default function ModalTerminar({
    openTerminarModal, setOpenTerminarModal,
    selectedAsignacion,
    terminarData, setTerminarData,
    handleTerminar,
}) {
    if (!openTerminarModal) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b bg-gradient-to-r from-green-50 to-white">
                    <h3 className="text-lg font-bold text-green-800">✅ Marcar Tóner como Terminado</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium">Tóner: {selectedAsignacion?.toner?.marca} {selectedAsignacion?.toner?.modelo}</p>
                        <p className="text-xs text-gray-500">Serie: {selectedAsignacion?.toner?.serie}</p>
                        <p className="text-xs text-gray-500 mt-1">Asignado a: {selectedAsignacion?.persona?.apellidos}, {selectedAsignacion?.persona?.nombres}</p>
                        <p className="text-xs text-gray-500">Fecha de asignación: {selectedAsignacion?.fecha_asignacion}</p>
                    </div>

                    <Field label="Fecha de terminado">
                        <input
                            type="date"
                            value={terminarData.fecha_terminado}
                            onChange={(e) => setTerminarData({ ...terminarData, fecha_terminado: e.target.value })}
                            className="w-full text-sm border rounded-lg px-3 py-2"
                        />
                    </Field>

                    <Field label="Observaciones finales">
                        <textarea
                            rows="2"
                            value={terminarData.observaciones}
                            onChange={(e) => setTerminarData({ ...terminarData, observaciones: e.target.value })}
                            placeholder="Ej. Tóner agotado, rendimiento normal..."
                            className="w-full text-sm border rounded-lg px-3 py-2 resize-none"
                        />
                    </Field>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <Button appearance="secondary" onClick={() => setOpenTerminarModal(false)}>Cancelar</Button>
                    <Button appearance="primary" onClick={handleTerminar}>Confirmar Terminado</Button>
                </div>
            </div>
        </div>
    )
}
