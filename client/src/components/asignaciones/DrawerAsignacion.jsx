import {
    DismissRegular,
    SearchRegular,
    PersonRegular,
    BuildingRegular,
    WarningRegular,
    CheckmarkCircleRegular
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
    Field,
    Badge
} from '@fluentui/react-components'

const getCondicionBadge = (condicion) => {
    switch (condicion) {
        case 'Bueno': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Bueno</span>
        case 'Regular': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Regular</span>
        case 'Malo': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Malo</span>
        case 'Chatarra': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Chatarra</span>
        default: return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{condicion || '—'}</span>
    }
}

const getEstadoBienBadge = (estado) => {
    switch (estado) {
        case 'Activo': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Disponible</span>
        case 'Asignado': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Asignado</span>
        default: return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{estado}</span>
    }
}

export default function DrawerAsignacion({
    openModal, setOpenModal,
    editMode,
    formData, setFormData,
    searchTermBien, setSearchTermBien,
    showBienDropdown, setShowBienDropdown,
    bienesFiltrados, bienes, personas, pisos, todosLosAmbientes, ambientesFiltrados,
    selectedPiso, setSelectedPiso,
    infoResponsable, infoAmbiente,
    areas,
    handlePersonaChange, handleAmbienteChange, handleInputChange,
    handleSubmit, resetForm,
    submitting
}) {
    return (
        <Drawer position="end" open={openModal} onOpenChange={(_, data) => setOpenModal(data.open)} size='large'>
            <DrawerHeader className="border-b border-gray-100 bg-blue-50/40">
                <DrawerHeaderTitle
                    action={
                        <Button appearance="subtle" icon={<DismissRegular />} onClick={() => {
                            setOpenModal(false)
                            resetForm()
                            setSearchTermBien('')
                        }} />
                    }
                >
                    <div>
                        <span className="text-lg font-bold text-slate-800">
                            {editMode ? '✏️ Editar Asignación' : '📝 Nueva Asignación'}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">Complete los datos del bien y el servidor responsable</p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="space-y-5 p-6">
                <Field label="Bien Patrimonial *" required>
                    <div className="relative">
                        <Input
                            size="small"
                            contentBefore={<SearchRegular className="text-gray-400" />}
                            placeholder="🔍 Buscar por tipo, marca, modelo, código patrimonial o serie..."
                            value={searchTermBien}
                            onChange={(e) => {
                                setSearchTermBien(e.target.value)
                                setShowBienDropdown(true)
                            }}
                            onFocus={() => setShowBienDropdown(true)}
                        />

                        {showBienDropdown && bienesFiltrados.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-sm max-h-64 overflow-y-auto">
                                {bienesFiltrados.map(b => (
                                    <div
                                        key={b.id}
                                        className="px-3 py-2.5 hover:bg-blue-50/50 cursor-pointer border-b last:border-0 transition-colors"
                                        onClick={() => {
                                            setFormData({ ...formData, bien_id: b.id })
                                            setSearchTermBien(`${b.tipo_equipo} - ${b.codigo_patrimonial || 'S/C'} (${b.marca || 'S/M'})`)
                                            setShowBienDropdown(false)
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-sm">{b.tipo_equipo}</span>
                                                    <Badge appearance="outline" color="brand" size="small">
                                                        {b.codigo_patrimonial || 'S/C'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {b.marca} {b.modelo}
                                                </p>
                                                <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                                                    <span>🔢 Serie: {b.serie || 'N/A'}</span>
                                                    <span>🏷️ Código TI: {b.codigo_ti || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2 flex flex-col items-end gap-1">
                                                {getEstadoBienBadge(b.estado)}
                                                {getCondicionBadge(b.condicion)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showBienDropdown && bienesFiltrados.length === 0 && searchTermBien && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-sm p-4 text-center text-gray-500 text-sm">
                                No se encontraron bienes con: "{searchTermBien}"
                            </div>
                        )}

                        {formData.bien_id && !showBienDropdown && (
                            <div className="mt-3 p-3 bg-blue-50/30 rounded-xl border border-blue-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold text-blue-800">✅ Bien seleccionado</span>
                                            <Badge appearance="filled" color="brand" size="small">
                                                {bienes.find(b => b.id === formData.bien_id)?.codigo_patrimonial || 'S/C'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800 mt-1">
                                            {bienes.find(b => b.id === formData.bien_id)?.tipo_equipo}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {bienes.find(b => b.id === formData.bien_id)?.marca} {bienes.find(b => b.id === formData.bien_id)?.modelo}
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] text-gray-400">Serie: {bienes.find(b => b.id === formData.bien_id)?.serie || 'N/A'}</span>
                                            {getCondicionBadge(bienes.find(b => b.id === formData.bien_id)?.condicion)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setFormData({ ...formData, bien_id: '' })
                                            setSearchTermBien('')
                                        }}
                                        className="text-xs text-red-500 hover:text-red-700 underline"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </Field>

                <Field label="Servidor Público Responsable *" required>
                    <Select
                        size="small"
                        name="persona_id"
                        value={formData.persona_id}
                        onChange={(e, data) => handlePersonaChange({ target: { name: 'persona_id', value: data.value } })}
                    >
                        <option value="">-- Seleccionar Responsable --</option>
                        {personas.map(p => (
                            <option key={p.id} value={p.id}>
                                👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                            </option>
                        ))}
                    </Select>
                </Field>

                {infoResponsable && (
                    <div className="bg-blue-50/30 rounded-xl p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <PersonRegular className="text-blue-600 text-sm" />
                            <span className="text-xs font-semibold text-blue-800">Información del Responsable</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-[10px] text-gray-500">Nombre completo</p>
                                <p className="font-medium text-gray-800">{infoResponsable.nombres}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500">DNI</p>
                                <p className="font-mono font-medium">{infoResponsable.dni}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500">Cargo</p>
                                <p className="font-medium">{infoResponsable.cargo}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500">Contacto</p>
                                <p className="text-xs">{infoResponsable.email} | {infoResponsable.telefono}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Piso / Nivel">
                        <Select
                            size="small"
                            value={selectedPiso}
                            onChange={(e, data) => setSelectedPiso(data.value)}
                        >
                            <option value="">-- Todos los pisos --</option>
                            {pisos.map(p => (
                                <option key={p.id} value={p.id}>
                                    🏢 {p.nombre || `Piso ${p.numero}`}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <Field label="Ambiente / Oficina">
                        <Select
                            size="small"
                            name="ambiente_id"
                            value={formData.ambiente_id}
                            onChange={(e, data) => handleAmbienteChange({ target: { name: 'ambiente_id', value: data.value } })}
                        >
                            <option value="">-- Seleccionar Ambiente --</option>
                            {(selectedPiso ? ambientesFiltrados : todosLosAmbientes).map(a => (
                                <option key={a.id} value={a.id}>
                                    📍 {a.nombre} ({a.codigo})
                                </option>
                            ))}
                        </Select>
                    </Field>
                </div>

                {infoAmbiente && (
                    <div className="bg-green-50/30 rounded-xl p-3 border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                            <BuildingRegular className="text-green-600 text-sm" />
                            <span className="text-xs font-semibold text-green-800">Información de la Ubicación</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-[10px] text-gray-500">Ambiente</p>
                                <p className="font-medium text-gray-800">{infoAmbiente.nombre}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500">Código</p>
                                <p className="font-mono font-medium">{infoAmbiente.codigo}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500">Ubicación</p>
                                <p className="font-medium">{infoAmbiente.piso}</p>
                            </div>
                            {infoAmbiente.area && (
                                <div>
                                    <p className="text-[10px] text-gray-500">Área</p>
                                    <p className="font-medium text-blue-700">{infoAmbiente.area}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] text-gray-500">Bienes ocupados</p>
                                <p className={`font-medium ${infoAmbiente.bienesOcupados > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                    {infoAmbiente.bienesOcupados} equipos
                                </p>
                            </div>
                        </div>
                        {infoAmbiente.bienesOcupados > 0 && (
                            <div className="mt-2 pt-2 border-t border-green-100 text-[11px] text-amber-600 flex items-center gap-1">
                                <WarningRegular className="text-amber-500 text-xs" />
                                ⚠️ Este ambiente ya tiene {infoAmbiente.bienesOcupados} bienes asignados
                            </div>
                        )}
                    </div>
                )}

                <Field label="Detalle de ubicación">
                    <Input
                        size="small"
                        name="ubicacion_detalle"
                        value={formData.ubicacion_detalle}
                        onChange={handleInputChange}
                        placeholder="Ej. Oficina 205, escritorio 3, ala norte..."
                    />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Fecha de Asignación">
                        <Input
                            size="small"
                            type="date"
                            name="fecha_asignacion"
                            value={formData.fecha_asignacion}
                            onChange={handleInputChange}
                        />
                    </Field>
                </div>

                <Field label="Documento de referencia">
                    <Input
                        size="small"
                        name="documento_referencia"
                        value={formData.documento_referencia}
                        onChange={handleInputChange}
                        placeholder="Ej. Memorando N° 001-2025, Resolución Directoral..."
                    />
                </Field>

                <Field label="Asignado por / Entregado por">
                    <Select
                        size="small"
                        name="persona_origen_id"
                        value={formData.persona_origen_id}
                        onChange={(e, data) => handleInputChange({ target: { name: 'persona_origen_id', value: data.value } })}
                    >
                        <option value="">-- Seleccionar --</option>
                        {(() => {
                            const areaInformatica = areas.find(a => a.nombre?.toLowerCase() === 'informática')
                            const filtradas = areaInformatica
                                ? personas.filter(p => p.area_id === areaInformatica.id)
                                : personas
                            return filtradas.map(p => (
                                <option key={p.id} value={p.id}>
                                    👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                                </option>
                            ))
                        })()}
                    </Select>
                </Field>

                <Field label="Motivo de asignación">
                    <Select
                        size="small"
                        name="motivo"
                        value={formData.motivo}
                        onChange={(e, data) => handleInputChange({ target: { name: 'motivo', value: data.value } })}
                    >
                        <option value="">-- Seleccionar motivo --</option>
                        <option value="Asignación por cargo">👔 Asignación por cargo</option>
                        <option value="Nueva contratación">🆕 Nueva contratación</option>
                        <option value="Reemplazo de equipo">🔄 Reemplazo de equipo</option>
                        <option value="Asignación temporal">⏱️ Asignación temporal</option>
                        <option value="Inventario inicial">📋 Inventario inicial</option>
                        <option value="Otro">📝 Otro</option>
                    </Select>
                </Field>

                <Field label="Observaciones">
                    <Textarea
                        size="small"
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleInputChange}
                        placeholder="Ej. Bien asignado para uso administrativo, incluye cargador y funda..."
                    />
                </Field>

                {formData.bien_id && formData.persona_id && (
                    <div className="bg-blue-50/20 rounded-xl p-4 mt-2">
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <CheckmarkCircleRegular className="text-green-600" />
                            Resumen de la Asignación
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">🔹 <span className="font-medium">Bien:</span> {bienes.find(b => b.id === formData.bien_id)?.tipo_equipo}</div>
                            <div className="flex items-center gap-1">🔹 <span className="font-medium">Código:</span> {bienes.find(b => b.id === formData.bien_id)?.codigo_patrimonial || 'N/A'}</div>
                            <div className="flex items-center gap-1">🔹 <span className="font-medium">Responsable:</span> {personas.find(p => p.id === formData.persona_id)?.apellidos}</div>
                            <div className="flex items-center gap-1">🔹 <span className="font-medium">Ubicación:</span> {todosLosAmbientes.find(a => a.id === formData.ambiente_id)?.nombre || 'Pendiente'}</div>
                            <div className="flex items-center gap-1 col-span-2">🔹 <span className="font-medium">Fecha:</span> {formData.fecha_asignacion}</div>
                        </div>
                    </div>
                )}
            </DrawerBody>

            <DrawerFooter className="border-t border-gray-100 pt-4 pb-4 flex justify-end gap-3">
                <Button size="small" appearance="secondary" onClick={() => {
                    setOpenModal(false)
                    resetForm()
                    setSearchTermBien('')
                }}>
                    Cancelar
                </Button>
                <Button size="small" appearance="primary" icon={<CheckmarkCircleRegular />} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Guardando...' : (editMode ? 'Actualizar Asignación' : 'Confirmar Asignación')}
                </Button>
            </DrawerFooter>
        </Drawer>
    )
}
