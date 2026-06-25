import {
    DismissRegular,
    BoxRegular
} from '@fluentui/react-icons'
import {
    Button,
    Input,
    Textarea,
    Select,
    Drawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerBody,
    DrawerFooter,
    Field
} from '@fluentui/react-components'

const ACTION_TABS = [
    { value: 'traslado', label: '🔄 Trasladar', description: 'Transferir a otro responsable y ubicación' },
    { value: 'devolucion', label: '↩️ Devolver', description: 'Devolver al almacén general' },
    { value: 'baja', label: '⚠️ Dar de Baja', description: 'Dar de baja definitiva del bien' }
]

const MOTIVOS = {
    traslado: [
        { value: 'Reasignación de funciones', label: '🔄 Reasignación de funciones' },
        { value: 'Rotación de personal', label: '🔄 Rotación de personal' },
        { value: 'Cambio de área', label: '📁 Cambio de área' },
        { value: 'Otro', label: '📝 Otro' }
    ],
    devolucion: [
        { value: 'Mantenimiento del equipo', label: '🔧 Mantenimiento del equipo' },
        { value: 'Fin de uso', label: '✅ Fin de uso' },
        { value: 'Excedente', label: '📦 Excedente' },
        { value: 'Otro', label: '📝 Otro' }
    ],
    baja: [
        { value: 'Obsolescencia', label: '📅 Obsolescencia' },
        { value: 'Deterioro', label: '💥 Deterioro' },
        { value: 'Pérdida', label: '🔍 Pérdida' },
        { value: 'Robo', label: '🚨 Robo' },
        { value: 'Otro', label: '📝 Otro' }
    ]
}

export default function DrawerTraslado({
    openTrasladoModal, setOpenTrasladoModal,
    selectedAsignacion,
    trasladoData, setTrasladoData,
    infoNuevoResponsable, setInfoNuevoResponsable,
    infoNuevoAmbiente, setInfoNuevoAmbiente,
    handleNuevoResponsableChange, handleNuevoAmbienteChange,
    handleTraslado, resetTrasladoForm,
    personas, todosLosAmbientes,
    submitting,
    requestCloseTrasladoDrawer
}) {
    const tipo = trasladoData.tipo || 'traslado'

    const handleTabChange = (nuevoTipo) => {
        if (nuevoTipo === tipo) return
        setTrasladoData({
            ...trasladoData,
            tipo: nuevoTipo,
            persona_destino_id: '',
            ambiente_destino_id: '',
            motivo: '',
            motivo_especifico: ''
        })
        setInfoNuevoResponsable(null)
        setInfoNuevoAmbiente(null)
    }

    const headerInfo = ACTION_TABS.find(t => t.value === tipo)
    const motivos = MOTIVOS[tipo] || []

    return (
        <Drawer position="end" open={openTrasladoModal}
            onOpenChange={(_, data) => { if (!data.open) requestCloseTrasladoDrawer(); else setOpenTrasladoModal(true) }}
            size='large'
        >
            <DrawerHeader className="border-b border-gray-100 bg-amber-50/40">
                <DrawerHeaderTitle
                    action={<Button appearance="subtle" icon={<DismissRegular />}
                        onClick={requestCloseTrasladoDrawer} />}
                >
                    <div>
                        <span className="text-lg font-bold text-slate-800">{headerInfo?.label} Bien</span>
                        <p className="text-xs text-gray-500 mt-0.5">{headerInfo?.description}</p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="space-y-4 p-5 my-5">
                <div className="flex gap-1 bg-blue-50/30 rounded-lg p-0.5">
                    {ACTION_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${tipo === tab.value
                                ? tab.value === 'baja'
                                    ? 'bg-red-50 text-red-600 border border-red-200'
                                    : 'bg-white text-blue-600 border border-gray-100'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-blue-50/30 rounded-lg p-3 border border-blue-100">
                    <p className="text-[11px] font-semibold text-blue-800 mb-1 flex items-center gap-2">
                        <BoxRegular className="text-blue-600" />
                        Bien a {tipo === 'traslado' ? 'trasladar' : tipo === 'devolucion' ? 'devolver' : 'dar de baja'}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <p className="text-[11px] text-gray-500">Tipo de Equipo</p>
                            <p className="font-medium text-gray-800">{selectedAsignacion?.bien?.tipo_equipo}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500">Código Patrimonial</p>
                            <p className="font-mono text-xs font-medium text-blue-700">{selectedAsignacion?.bien?.codigo_patrimonial || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500">Marca / Modelo</p>
                            <p className="text-xs">{selectedAsignacion?.bien?.marca} {selectedAsignacion?.bien?.modelo}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500">Número de Serie</p>
                            <p className="text-[11px] font-mono">{selectedAsignacion?.bien?.serie || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50/30 rounded-lg p-3 border border-amber-100">
                    <p className="text-[11px] font-semibold text-amber-800 mb-1">📍 Situación actual</p>
                    <p className="text-xs">Responsable: <span className="font-medium">{selectedAsignacion?.persona?.apellidos}, {selectedAsignacion?.persona?.nombres}</span></p>
                    <p className="text-xs">Ubicación: {selectedAsignacion?.ambiente?.nombre} ({selectedAsignacion?.ambiente?.piso?.nombre || `Piso ${selectedAsignacion?.ambiente?.piso?.numero}`})</p>
                </div>

                {tipo === 'traslado' && (
                    <>
                        <Field label="Nuevo Responsable *" required>
                            <Select
                                size="small"
                                value={trasladoData.persona_destino_id}
                                onChange={(e, data) => handleNuevoResponsableChange({ target: { value: data.value } })}
                            >
                                <option value="">-- Seleccionar nuevo responsable --</option>
                                {personas.filter(p => p.id !== selectedAsignacion?.persona_id).map(p => (
                                    <option key={p.id} value={p.id}>
                                        👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                                    </option>
                                ))}
                            </Select>
                        </Field>

                        {infoNuevoResponsable && trasladoData.persona_destino_id && (
                            <div className="bg-green-50/30 rounded-xl p-3 border border-green-100">
                                <p className="text-xs font-semibold text-green-800">✅ Nuevo responsable</p>
                                <p className="text-sm">{infoNuevoResponsable.nombres}</p>
                                <p className="text-xs text-gray-500">DNI: {infoNuevoResponsable.dni} | {infoNuevoResponsable.cargo}</p>
                            </div>
                        )}

                        <Field label="Nueva Ubicación *" required>
                            <Select
                                size="small"
                                value={trasladoData.ambiente_destino_id}
                                onChange={(e, data) => handleNuevoAmbienteChange({ target: { value: data.value } })}
                            >
                                <option value="">-- Seleccionar nueva ubicación --</option>
                                {todosLosAmbientes.map(a => (
                                    <option key={a.id} value={a.id}>
                                        📍 {a.nombre} ({a.piso?.nombre || `Piso ${a.piso?.numero}`})
                                    </option>
                                ))}
                            </Select>
                        </Field>

                        {infoNuevoAmbiente && trasladoData.ambiente_destino_id && (
                            <div className="bg-green-50/30 rounded-xl p-3 border border-green-100">
                                <p className="text-xs font-semibold text-green-800">✅ Nueva ubicación</p>
                                <p className="text-sm">{infoNuevoAmbiente.nombre}</p>
                                <p className="text-xs text-gray-500">Código: {infoNuevoAmbiente.codigo} | {infoNuevoAmbiente.piso}</p>
                            </div>
                        )}
                    </>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Field label={tipo === 'baja' ? 'Motivo de Baja *' : tipo === 'devolucion' ? 'Motivo de Devolución *' : 'Motivo del Traslado *'}>
                        <Select
                            size="small"
                            value={trasladoData.motivo}
                            onChange={(e, data) => setTrasladoData({ ...trasladoData, motivo: data.value })}
                        >
                            <option value="">-- Seleccionar motivo --</option>
                            {motivos.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </Select>
                    </Field>

                    <Field label="Fecha">
                        <Input
                            size="small"
                            type="date"
                            value={trasladoData.fecha}
                            onChange={(e) => setTrasladoData({ ...trasladoData, fecha: e.target.value })}
                        />
                    </Field>
                </div>

                {trasladoData.motivo === 'Otro' && (
                    <Field label="Especificar motivo">
                        <Input
                            size="small"
                            placeholder="Describa el motivo..."
                            value={trasladoData.motivo_especifico}
                            onChange={(e) => setTrasladoData({ ...trasladoData, motivo_especifico: e.target.value })}
                        />
                    </Field>
                )}

                <Field label="Documento de referencia">
                    <Input
                        size="small"
                        placeholder="Ej. Memorando N° 001-2024, Resolución..."
                        value={trasladoData.documento_referencia}
                        onChange={(e) => setTrasladoData({ ...trasladoData, documento_referencia: e.target.value })}
                    />
                </Field>

                <Field label="Registrado por">
                    <Select
                        size="small"
                        value={trasladoData.usuario_registro}
                        onChange={(e, data) => setTrasladoData({ ...trasladoData, usuario_registro: data.value })}
                    >
                        <option value="">-- Seleccionar responsable del registro --</option>
                        {personas.map(p => (
                            <option key={p.id} value={p.id}>
                                👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                            </option>
                        ))}
                    </Select>
                </Field>

                <Field label="Observaciones">
                    <Textarea
                        size="small"
                        placeholder={tipo === 'traslado' ? "Notas adicionales sobre el traslado..."
                            : tipo === 'devolucion' ? "Notas adicionales sobre la devolución..."
                            : "Notas adicionales sobre la baja..."}
                        value={trasladoData.observaciones}
                        onChange={(e, data) => setTrasladoData({ ...trasladoData, observaciones: data.value })}
                    />
                </Field>
            </DrawerBody>

            <DrawerFooter className="border-t border-gray-100 pt-4 pb-4 flex justify-end gap-3">
                <Button size="small" appearance="secondary" onClick={requestCloseTrasladoDrawer}>
                    Cancelar
                </Button>
                <Button size="small" appearance="primary" onClick={handleTraslado} disabled={submitting}>
                    {submitting ? 'Guardando...' : (tipo === 'traslado' ? 'Confirmar Traslado' : tipo === 'devolucion' ? 'Confirmar Devolución' : 'Confirmar Baja')}
                </Button>
            </DrawerFooter>
        </Drawer>
    )
}