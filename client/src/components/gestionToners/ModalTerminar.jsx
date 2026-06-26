import { Button, Field, Input, Textarea, Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent } from '@fluentui/react-components'

export default function ModalTerminar({
    openTerminarModal, setOpenTerminarModal,
    selectedAsignacion,
    terminarData, setTerminarData,
    handleTerminar,
    submitting,
}) {
    return (
        <Dialog open={openTerminarModal} onOpenChange={(_, { open }) => setOpenTerminarModal(open)}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>Marcar tóner como terminado</DialogTitle>
                    <DialogContent className="space-y-4">
                        {selectedAsignacion && (
                            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-sm space-y-1">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                    {selectedAsignacion.toner && (
                                        <><span className="text-gray-500">Tóner:</span><span className="font-medium">{selectedAsignacion.toner.marca} {selectedAsignacion.toner.modelo} ({selectedAsignacion.toner.color_toner})</span></>
                                    )}
                                    {selectedAsignacion.toner?.serie && <><span className="text-gray-500">Serie:</span><span className="font-medium">{selectedAsignacion.toner.serie}</span></>}
                                    {selectedAsignacion.persona && (
                                        <><span className="text-gray-500">Responsable:</span><span className="font-medium">{selectedAsignacion.persona.apellidos} {selectedAsignacion.persona.nombres}</span></>
                                    )}
                                    {selectedAsignacion.fecha_asignacion && (
                                        <><span className="text-gray-500">Fecha asignación:</span><span className="font-medium">{selectedAsignacion.fecha_asignacion}</span></>
                                    )}
                                </div>
                            </div>
                        )}
                        <Field label="Fecha de terminado" required>
                            <Input
                                type="date"
                                value={terminarData.fecha_terminado}
                                onChange={(_, data) => setTerminarData({ ...terminarData, fecha_terminado: data.value })}
                            />
                        </Field>
                        <Field label="Observaciones finales">
                            <Textarea
                                value={terminarData.observaciones}
                                onChange={(_, data) => setTerminarData({ ...terminarData, observaciones: data.value })}
                                placeholder="Ej. Tóner agotado, rendimiento normal..."
                            />
                        </Field>
                    </DialogContent>
                    <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary">Cancelar</Button>
                        </DialogTrigger>
                        <Button appearance="primary" onClick={handleTerminar} disabled={submitting}>
                            {submitting ? 'Guardando...' : 'Confirmar Terminado'}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    )
}
