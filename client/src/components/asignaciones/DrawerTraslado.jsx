import {
    DismissRegular,
    BoxRegular,
    PersonRegular,
    ArrowSwapRegular,
    CalendarRegular
} from '@fluentui/react-icons'
import {
    Button,
    Drawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerBody,
    DrawerFooter,
    Field
} from '@fluentui/react-components'

export default function DrawerTraslado({
    openTrasladoModal, setOpenTrasladoModal,
    selectedAsignacion,
    trasladoData, setTrasladoData,
    infoNuevoResponsable, infoNuevoAmbiente,
    handleNuevoResponsableChange, handleNuevoAmbienteChange,
    handleTraslado, resetTrasladoForm,
    personas, todosLosAmbientes
}) {
    return (
        <Drawer position="end" open={openTrasladoModal} onOpenChange={(_, data) => setOpenTrasladoModal(data.open)} size='medium'>
            <DrawerHeader className="border-b bg-gradient-to-r from-amber-50 to-white">
                <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => { setOpenTrasladoModal(false); resetTrasladoForm() }} />}>
                    <div>
                        <span className="text-lg font-bold text-slate-800">🔄 Trasladar Bien Patrimonial</span>
                        <p className="text-xs text-gray-500 mt-0.5">Complete los datos del nuevo responsable y ubicación</p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="space-y-5 p-6 my-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <BoxRegular className="text-blue-600" />
                        Bien a trasladar
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-gray-500">Tipo de Equipo</p>
                            <p className="font-semibold text-gray-800">{selectedAsignacion?.bien?.tipo_equipo}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Código Patrimonial</p>
                            <p className="font-mono text-sm font-medium text-blue-700">{selectedAsignacion?.bien?.codigo_patrimonial || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Marca / Modelo</p>
                            <p className="text-sm">{selectedAsignacion?.bien?.marca} {selectedAsignacion?.bien?.modelo}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Número de Serie</p>
                            <p className="text-xs font-mono">{selectedAsignacion?.bien?.serie || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800 mb-2">📍 Situación actual</p>
                    <p className="text-sm">Responsable: <span className="font-medium">{selectedAsignacion?.persona?.apellidos}, {selectedAsignacion?.persona?.nombres}</span></p>
                    <p className="text-sm">Ubicación: {selectedAsignacion?.ambiente?.nombre} ({selectedAsignacion?.ambiente?.piso?.nombre || `Piso ${selectedAsignacion?.ambiente?.piso?.numero}`})</p>
                </div>

                <Field label="Nuevo Responsable *" required>
                    <select
                        value={trasladoData.persona_destino_id}
                        onChange={handleNuevoResponsableChange}
                        className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                    >
                        <option value="">-- Seleccionar nuevo responsable --</option>
                        {personas.filter(p => p.id !== selectedAsignacion?.persona_id).map(p => (
                            <option key={p.id} value={p.id}>
                                👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                            </option>
                        ))}
                    </select>
                </Field>

                {infoNuevoResponsable && trasladoData.persona_destino_id && (
                    <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                        <p className="text-xs font-semibold text-green-800">✅ Nuevo responsable</p>
                        <p className="text-sm">{infoNuevoResponsable.nombres}</p>
                        <p className="text-xs text-gray-500">DNI: {infoNuevoResponsable.dni} | {infoNuevoResponsable.cargo}</p>
                    </div>
                )}

                <Field label="Nueva Ubicación *" required>
                    <select
                        value={trasladoData.ambiente_destino_id}
                        onChange={handleNuevoAmbienteChange}
                        className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                    >
                        <option value="">-- Seleccionar nueva ubicación --</option>
                        {todosLosAmbientes.map(a => (
                            <option key={a.id} value={a.id}>
                                📍 {a.nombre} ({a.piso?.nombre || `Piso ${a.piso?.numero}`})
                            </option>
                        ))}
                    </select>
                </Field>

                {infoNuevoAmbiente && trasladoData.ambiente_destino_id && (
                    <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                        <p className="text-xs font-semibold text-green-800">✅ Nueva ubicación</p>
                        <p className="text-sm">{infoNuevoAmbiente.nombre}</p>
                        <p className="text-xs text-gray-500">Código: {infoNuevoAmbiente.codigo} | {infoNuevoAmbiente.piso}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Motivo del Traslado *">
                        <select
                            value={trasladoData.motivo}
                            onChange={(e) => setTrasladoData({ ...trasladoData, motivo: e.target.value })}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Seleccionar motivo --</option>
                            <option value="Reasignación de funciones">🔄 Reasignación de funciones</option>
                            <option value="Rotación de personal">🔄 Rotación de personal</option>
                            <option value="Mantenimiento del equipo">🔧 Mantenimiento del equipo</option>
                            <option value="Cambio de área">📁 Cambio de área</option>
                            <option value="Préstamo temporal">⏱️ Préstamo temporal</option>
                            <option value="Otro">📝 Otro</option>
                        </select>
                    </Field>

                    <Field label="Fecha del traslado">
                        <input
                            type="date"
                            value={trasladoData.fecha}
                            onChange={(e) => setTrasladoData({ ...trasladoData, fecha: e.target.value })}
                            className="w-full text-sm border rounded-lg px-3 py-2.5"
                        />
                    </Field>
                </div>

                {trasladoData.motivo === 'Otro' && (
                    <Field label="Especificar motivo">
                        <input
                            type="text"
                            placeholder="Describa el motivo del traslado..."
                            value={trasladoData.motivo_especifico}
                            onChange={(e) => setTrasladoData({ ...trasladoData, motivo_especifico: e.target.value })}
                            className="w-full text-sm border rounded-lg px-3 py-2.5"
                        />
                    </Field>
                )}

                <Field label="Documento de referencia">
                    <input
                        type="text"
                        placeholder="Ej. Memorando N° 001-2024, Resolución..."
                        value={trasladoData.documento_referencia}
                        onChange={(e) => setTrasladoData({ ...trasladoData, documento_referencia: e.target.value })}
                        className="w-full text-sm border rounded-lg px-3 py-2.5"
                    />
                </Field>

                <Field label="Registrado por">
                    <select
                        value={trasladoData.usuario_registro}
                        onChange={(e) => setTrasladoData({ ...trasladoData, usuario_registro: e.target.value })}
                        className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                    >
                        <option value="">-- Seleccionar responsable del registro --</option>
                        {personas.map(p => (
                            <option key={p.id} value={p.id}>
                                👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Observaciones">
                    <textarea
                        rows="3"
                        placeholder="Notas adicionales sobre el traslado..."
                        value={trasladoData.observaciones}
                        onChange={(e) => setTrasladoData({ ...trasladoData, observaciones: e.target.value })}
                        className="w-full text-sm border rounded-lg px-3 py-2.5 resize-none"
                    />
                </Field>
            </DrawerBody>

            <DrawerFooter className="border-t pt-4 pb-4 bg-gray-50 flex justify-end gap-3">
                <Button appearance="secondary" onClick={() => { setOpenTrasladoModal(false); resetTrasladoForm() }}>Cancelar</Button>
                <Button appearance="primary" onClick={handleTraslado}>Confirmar Traslado</Button>
            </DrawerFooter>
        </Drawer>
    )
}
