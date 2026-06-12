import {
  Button,
  Input,
  Field,
  Textarea,
  Subtitle2,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle
} from '@fluentui/react-components'
import {
  DismissRegular, AddRegular, PersonRegular, WarningRegular,
  ClipboardRegular, LocationRegular, SettingsRegular, CalendarRegular, EditRegular
} from '@fluentui/react-icons'
import { useState } from 'react'

const TIPOS_PROBLEMA = [
  { value: 'Internet', label: '🌐 Internet / Red', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Hardware', label: '💻 Hardware (PC, laptop, monitor)', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'Software', label: '📦 Software / Sistema', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'Impresora', label: '🖨️ Impresora / Scanner', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'Telefonía', label: '📞 Telefonía', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'Cableado', label: '🔌 Cableado / Electricidad', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'Correo', label: '✉️ Correo electrónico', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'Seguridad', label: '🔒 Seguridad / Antivirus', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'Capacitación', label: '📚 Capacitación', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'Suministros', label: '📦 Suministros (tóner, papel)', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'Otro', label: '📝 Otro', color: 'bg-gray-50 text-gray-700 border-gray-200' }
]

const DrawerBitacora = ({
  open, onClose, editMode, formData, onInputChange, onSubmit,
  personas, ambientes, submitting
}) => {
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const personaNombre = (p) => `${p.apellidos}, ${p.nombres}`
  const personaLabel = (p) => {
    const area = p.area ? ` (${p.area.nombre})` : ''
    return `${personaNombre(p)}${area}`
  }
  const ambienteLabel = (a) => {
    const piso = a.piso ? ` - ${a.piso.nombre || `Piso ${a.piso.numero}`}` : ''
    const area = a.area ? ` - ${a.area.nombre}` : ''
    return `${a.nombre}${piso}${area}`
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.persona_id) newErrors.persona_id = 'Selecciona una persona'
    if (!formData.tipo_problema) newErrors.tipo_problema = 'Selecciona un tipo de problema'
    if (!formData.ambiente_id) newErrors.ambiente_id = 'Selecciona un ambiente'
    if (!formData.descripcion?.trim()) newErrors.descripcion = 'Describe el problema reportado'
    setErrors(newErrors)
    setTouched({ persona_id: true, tipo_problema: true, ambiente_id: true, descripcion: true })
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name } = e.target
    setErrors(prev => ({ ...prev, [name]: undefined }))
    onInputChange(e)
  }

  const handleTipoClick = (value) => {
    setErrors(prev => ({ ...prev, tipo_problema: undefined }))
    onInputChange({ target: { name: 'tipo_problema', value } })
  }

  const handleSave = (e) => {
    e?.preventDefault()
    if (submitting) return
    if (!validate()) return
    onSubmit()
  }

  return (
    <Drawer position="end" open={open} onOpenChange={(_, data) => { if (!data.open) onClose() }} size="large">
      <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
        <DrawerHeaderTitle
          action={<Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} />}
        >
          <div>
            <span className="text-lg font-bold text-slate-800 inline-flex items-center gap-2">
              {editMode ? <><EditRegular /> Editar Atención</> : <><AddRegular /> Nueva Atención</>}
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              {editMode ? 'Actualiza los datos de la atención' : 'Registra una nueva atención de soporte'}
            </p>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className="p-6 my-6 space-y-6">
        {/* Persona */}
        <div className="flex flex-col gap-3">
          <Subtitle2 className="text-blue-700 flex items-center gap-1"><PersonRegular /> Persona Atendida</Subtitle2>
          <Divider color="brand" />
          <Field label="Persona *" required validationMessage={touched.persona_id && errors.persona_id ? errors.persona_id : undefined}>
            <select
              name="persona_id"
              value={formData.persona_id}
              onChange={handleChange}
              className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
            >
              <option value="">-- Seleccionar persona --</option>
              {personas.map(p => (
                <option key={p.id} value={p.id}>{personaLabel(p)}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Tipo de Problema */}
        <div className="flex flex-col gap-3">
          <Subtitle2 className="text-blue-700 flex items-center gap-1"><WarningRegular /> Tipo de Problema *</Subtitle2>
          <Divider />
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_PROBLEMA.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTipoClick(t.value)}
                className={`text-xs px-3 py-2 rounded-lg border transition-all text-left ${
                  formData.tipo_problema === t.value
                    ? 'ring-2 ring-blue-500 ring-offset-1 ' + t.color
                    : t.color + ' opacity-70 hover:opacity-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {touched.tipo_problema && errors.tipo_problema && (
            <p className="text-xs text-red-500 mt-1">{errors.tipo_problema}</p>
          )}
          {formData.tipo_problema === 'Otro' && (
            <Field label="Especificar otro problema">
              <Input
                name="tipo_problema_otro"
                value={formData.tipo_problema === 'Otro' ? formData.descripcion_otro || '' : ''}
                onChange={(e) => onInputChange({ target: { name: 'descripcion_otro', value: e.target.value } })}
                placeholder="Describe el problema..."
              />
            </Field>
          )}
        </div>

        {/* Detalles del Problema */}
        <div className="flex flex-col gap-3">
          <Subtitle2 className="text-blue-700 flex items-center gap-1"><ClipboardRegular /> Detalles</Subtitle2>
          <Divider />
          <Field label="Descripción del problema *" required validationMessage={touched.descripcion && errors.descripcion ? errors.descripcion : undefined}>
            <Textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe el problema reportado..."
              rows={3}
            />
          </Field>
          <Field label="Solución aplicada">
            <Textarea
              name="solucion"
              value={formData.solucion}
              onChange={onInputChange}
              placeholder="Describe qué se hizo para solucionarlo..."
              rows={3}
            />
          </Field>
        </div>

        {/* Ubicación */}
        <div className="flex flex-col gap-3">
          <Subtitle2 className="text-blue-700 flex items-center gap-1"><LocationRegular /> Ubicación</Subtitle2>
          <Divider />
          <Field label="Ambiente *" required validationMessage={touched.ambiente_id && errors.ambiente_id ? errors.ambiente_id : undefined}>
            <select
              name="ambiente_id"
              value={formData.ambiente_id}
              onChange={handleChange}
              className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
            >
              <option value="">-- Seleccionar ambiente --</option>
              {ambientes.map(a => (
                <option key={a.id} value={a.id}>{ambienteLabel(a)}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Estado y Prioridad */}
        <div className="flex flex-col gap-3">
          <Subtitle2 className="text-blue-700 flex items-center gap-1"><SettingsRegular /> Estado y Prioridad</Subtitle2>
          <Divider />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estado">
              <select
                name="estado"
                value={formData.estado}
                onChange={onInputChange}
                className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Resuelto">Resuelto</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </Field>
            <Field label="Prioridad">
              <select
                name="prioridad"
                value={formData.prioridad}
                onChange={onInputChange}
                className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Fechas y Seguimiento */}
        <div className="flex flex-col gap-3">
          <Subtitle2 className="text-blue-700 flex items-center gap-1"><CalendarRegular /> Fechas</Subtitle2>
          <Divider />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha de atención">
              <Input name="fecha_atencion" type="date" value={formData.fecha_atencion} onChange={onInputChange} />
            </Field>
            {formData.estado === 'Resuelto' || formData.estado === 'Cerrado' ? (
              <Field label="Fecha de cierre">
                <Input name="fecha_cierre" type="date" value={formData.fecha_cierre} onChange={onInputChange} />
              </Field>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de atención">
              <select
                name="tipo_atencion"
                value={formData.tipo_atencion}
                onChange={onInputChange}
                className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
              >
                <option value="Presencial">Presencial</option>
                <option value="Remota">Remota</option>
                <option value="Telefónica">Telefónica</option>
              </select>
            </Field>
            <Field label="Requiere seguimiento">
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  name="requiere_seguimiento"
                  checked={formData.requiere_seguimiento}
                  onChange={(e) => onInputChange({ target: { name: 'requiere_seguimiento', type: 'checkbox', checked: e.target.checked } })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-600">Sí, requiere seguimiento posterior</span>
              </div>
            </Field>
          </div>
        </div>
      </DrawerBody>

      <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
        <Button appearance="secondary" onClick={onClose}>Cancelar</Button>
        <Button appearance="primary" icon={<AddRegular />} onClick={handleSave} disabled={submitting}>
          {submitting ? 'Guardando...' : (editMode ? 'Actualizar' : 'Registrar Atención')}
        </Button>
      </div>
    </Drawer>
  )
}

export default DrawerBitacora
