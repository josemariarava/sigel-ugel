import { DismissRegular } from '@fluentui/react-icons'
import {
    Button,
    Drawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerBody,
    DrawerFooter,
    Field,
} from '@fluentui/react-components'

export default function DrawerAsignacionToners({
    openDrawer, setOpenDrawer,
    editMode, formData, handleInputChange,
    toners, tonersDisponibles,
    selectedTonerPreview, stockMismoModelo,
    entregadoPor, setEntregadoPor,
    personas, impresoras,
    selectedPiso, setSelectedPiso,
    ambientes, ambientesFiltrados, pisos,
    handleSubmit, resetForm,
    submitting,
}) {
    return (
        <Drawer position="end" open={openDrawer} onOpenChange={(_, data) => setOpenDrawer(data.open)} size='medium'>
            <DrawerHeader className="border-b bg-gradient-to-r from-amber-50 to-white">
                <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenDrawer(false)} />}>
                    <div>
                        <span className="text-lg font-bold text-slate-800">
                            {editMode ? '✏️ Editar Asignación de Tóner' : '📝 Nueva Asignación de Tóner'}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">Complete los datos para la entrega del consumible</p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="p-6 space-y-5">
                <Field label="Tóner a Asignar *" required>
                    <select
                        name="toner_id"
                        value={formData.toner_id}
                        onChange={handleInputChange}
                        className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        disabled={editMode}
                    >
                        <option value="">-- Seleccionar Tóner --</option>
                        {(editMode ? toners : tonersDisponibles).map(t => (
                            <option key={t.id} value={t.id}>
                                🧴 {t.marca} {t.modelo} - {t.color_toner || 'N/A'} - Serie: {t.serie || 'N/A'}{t.compra_detalle?.compra ? ` | O/C: ${t.compra_detalle.compra.orden_compra}` : ''}
                            </option>
                        ))}
                    </select>
                </Field>

                {selectedTonerPreview && (
                    <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-amber-800">📦 Tóner Seleccionado</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                            <div><span className="text-gray-500">Marca:</span> <span className="font-medium">{selectedTonerPreview.marca}</span></div>
                            <div><span className="text-gray-500">Modelo:</span> <span className="font-medium">{selectedTonerPreview.modelo}</span></div>
                            <div><span className="text-gray-500">Serie:</span> <span className="font-mono text-xs">{selectedTonerPreview.serie || '—'}</span></div>
                            <div><span className="text-gray-500">Color:</span> <span>{selectedTonerPreview.color_toner || '—'}</span></div>
                            <div><span className="text-gray-500">Rendimiento:</span> <span>{selectedTonerPreview.rendimiento ? `${selectedTonerPreview.rendimiento} págs` : '—'}</span></div>
                            <div><span className="text-gray-500">Lote:</span> <span className="font-mono text-xs">{selectedTonerPreview.lote || '—'}</span></div>
                            <div><span className="text-gray-500">Vencimiento:</span> <span>{selectedTonerPreview.fecha_vencimiento || '—'}</span></div>
                            <div><span className="text-gray-500">Ubicación almacén:</span> <span>{selectedTonerPreview.ubicacion_almacen || '—'}</span></div>
                        </div>
                        {selectedTonerPreview.compra_detalle?.compra && (
                            <div className="text-xs text-gray-500 border-t border-amber-200 pt-2 mt-1">
                                O/C: <strong>{selectedTonerPreview.compra_detalle.compra.orden_compra}</strong>
                                {selectedTonerPreview.compra_detalle.compra.proveedor && ` | Proveedor: ${selectedTonerPreview.compra_detalle.compra.proveedor}`}
                            </div>
                        )}
                        <div className="bg-white rounded-lg p-3 border border-amber-200 mt-2">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Stock del modelo {selectedTonerPreview.marca} {selectedTonerPreview.modelo}</p>
                            <div className="flex gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Disponibles: <strong>{stockMismoModelo.disponibles}</strong>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Asignados: <strong>{stockMismoModelo.asignados}</strong>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Total: <strong>{stockMismoModelo.total}</strong>
                                </span>
                            </div>
                            {stockMismoModelo.disponibles === 0 && (
                                <p className="text-xs text-red-600 mt-1">⚠️ No quedan tóneres disponibles de este modelo</p>
                            )}
                        </div>
                    </div>
                )}

                <Field label="Entregado por *" required>
                    <select
                        value={entregadoPor}
                        onChange={(e) => setEntregadoPor(e.target.value)}
                        className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                    >
                        <option value="">-- Seleccionar quien entrega --</option>
                        {personas.map(p => (
                            <option key={p.id} value={p.id}>
                                👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Impresora Destino">
                    <select
                        name="impresora_id"
                        value={formData.impresora_id}
                        onChange={handleInputChange}
                        className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                    >
                        <option value="">-- Seleccionar Impresora --</option>
                        {impresoras.map(i => (
                            <option key={i.id} value={i.id}>
                                🖨️ {i.marca} {i.modelo} - {i.serie || 'Sin serie'}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Responsable que Recibe *" required>
                    <select
                        name="persona_id"
                        value={formData.persona_id}
                        onChange={handleInputChange}
                        className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                    >
                        <option value="">-- Seleccionar Responsable --</option>
                        {personas.map(p => (
                            <option key={p.id} value={p.id}>
                                👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                            </option>
                        ))}
                    </select>
                </Field>

                <div className="grid grid-cols-2 gap-2">
                    <Field label="Piso">
                        <select
                            value={selectedPiso}
                            onChange={(e) => { setSelectedPiso(e.target.value); handleInputChange({ target: { name: 'ambiente_id', value: '' } }) }}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Piso --</option>
                            {pisos.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre || `Piso ${p.numero}`}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Ambiente">
                        <select
                            name="ambiente_id"
                            value={formData.ambiente_id}
                            onChange={(e) => { handleInputChange(e); if (e.target.value) { const amb = ambientes.find(a => a.id === e.target.value); if (amb) setSelectedPiso(amb.piso_id || '') } }}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Ambiente --</option>
                            {(selectedPiso ? ambientesFiltrados : ambientes).map(a => (
                                <option key={a.id} value={a.id}>
                                    📍 {a.nombre} ({a.codigo})
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Fecha de Asignación">
                        <input
                            type="date"
                            name="fecha_asignacion"
                            value={formData.fecha_asignacion}
                            onChange={handleInputChange}
                            className="w-full text-sm border rounded-lg px-3 py-2.5"
                        />
                    </Field>

                    <Field label="Documento Referencia">
                        <input
                            type="text"
                            name="documento_referencia"
                            value={formData.documento_referencia}
                            onChange={handleInputChange}
                            placeholder="Ej. Memorando N° 001-2026"
                            className="w-full text-sm border rounded-lg px-3 py-2.5"
                        />
                    </Field>
                </div>

                <Field label="Observaciones">
                    <textarea
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Notas adicionales sobre la entrega..."
                        className="w-full text-sm border rounded-lg px-3 py-2 resize-none"
                    />
                </Field>
            </DrawerBody>

            <DrawerFooter className="border-t pt-4 pb-4 bg-gray-50 flex justify-end gap-3">
                <Button appearance="secondary" onClick={() => setOpenDrawer(false)}>Cancelar</Button>
                <Button appearance="primary" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Guardando...' : (editMode ? 'Actualizar' : 'Confirmar Asignación')}
                </Button>
            </DrawerFooter>
        </Drawer>
    )
}
