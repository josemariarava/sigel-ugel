import {
  Button,
  Input,
  Select,
  Field,
  Textarea,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox
} from '@fluentui/react-components'
import {
  DismissRegular, AddRegular, PersonRegular, WarningRegular,
  ClipboardRegular, LocationRegular, SettingsRegular, CalendarRegular, EditRegular, ClockRegular, CheckmarkCircleRegular
} from '@fluentui/react-icons'
import { diffHumano } from '../../hooks/useBitacora'
import { useState, useEffect, useRef } from 'react'

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

const TIPO_ACTIVIDAD_OPTS = [
  { value: 'incidencia', icon: '🔧', label: 'Incidencia Técnica', desc: 'Soporte técnico, hardware, software' },
  { value: 'publicacion', icon: '📢', label: 'Publicación Web', desc: 'Convocatorias, comunicados, documentos' },
  { value: 'correo', icon: '✉️', label: 'Creación de Correo', desc: 'Cuentas de correo institucional' },
  { value: 'contrasena', icon: '🔐', label: 'Restablecer Contraseña', desc: 'Cambio o restablecimiento de acceso' },
  { value: 'otra', icon: '📝', label: 'Otra Actividad', desc: 'Actividad administrativa general' }
]

const STEPS = [
  { id: 1, label: 'Tipo de Actividad', subtitle: '¿Qué vas a registrar?', icon: ClipboardRegular },
  { id: 2, label: 'Responsable', subtitle: '¿Quién y dónde?', icon: PersonRegular },
  { id: 3, label: 'Detalles', subtitle: 'Describe la actividad', icon: WarningRegular },
  { id: 4, label: 'Control', subtitle: 'Prioridad y fecha', icon: SettingsRegular }
]

const DrawerBitacora = ({
  open, onClose, editMode, formData, onInputChange, onSubmit,
  personas, ambientes, submitting, numeroTicket, createdAt
}) => {
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [formDirty, setFormDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const initialFormRef = useRef(null)

  useEffect(() => {
    if (open) {
      initialFormRef.current = JSON.stringify(formData)
      setFormDirty(false)
      setCurrentStep(1)
      setErrors({})
      setTouched({})
    }
  }, [open])

  useEffect(() => {
    if (open && initialFormRef.current !== null) {
      setFormDirty(JSON.stringify(formData) !== initialFormRef.current)
    }
  }, [formData])

  const handleConfirmClose = () => {
    setConfirmClose(false)
    setFormDirty(false)
    initialFormRef.current = null
    onClose()
  }

  const handleCancelClose = () => setConfirmClose(false)

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
    else if (formData.tipo_problema === 'Otro' && !formData.descripcion_otro?.trim())
      newErrors.tipo_problema = 'Especifica el problema (campo "Otro")'
    if (!formData.ambiente_id) newErrors.ambiente_id = 'Selecciona un ambiente'
    if (!formData.descripcion?.trim()) newErrors.descripcion = 'Describe el problema reportado'
    setErrors(newErrors)
    setTouched({ persona_id: true, tipo_problema: true, ambiente_id: true, descripcion: true })
    return Object.keys(newErrors).length === 0
  }

  const validateStep = (step) => {
    switch (step) {
      case 1: return !!formData.tipo_actividad
      case 2:
        if (!formData.persona_id) return false
        if (formData.tipo_actividad === 'correo' || formData.tipo_actividad === 'contrasena') return true
        return !!formData.ambiente_id
      case 3:
        if (formData.tipo_actividad === 'incidencia') {
          if (!formData.descripcion?.trim()) return false
          if (!formData.tipo_problema) return false
          if (formData.tipo_problema === 'Otro' && !formData.descripcion_otro?.trim()) return false
        }
        if (formData.tipo_actividad === 'publicacion' || formData.tipo_actividad === 'otra') {
          if (!formData.descripcion?.trim()) return false
        }
        return true
      case 4: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      if (currentStep === 1) setTouched(prev => ({ ...prev, tipo_actividad: true }))
      else if (currentStep === 2) {
        setTouched(prev => ({
          ...prev,
          persona_id: true,
          ...(formData.tipo_actividad !== 'correo' && formData.tipo_actividad !== 'contrasena' ? { ambiente_id: true } : {})
        }))
      }
      else if (currentStep === 3) {
        setTouched(prev => ({
          ...prev,
          descripcion: true,
          ...(formData.tipo_actividad === 'incidencia' ? { tipo_problema: true, descripcion_otro: true } : {})
        }))
      }
      return
    }
    setCurrentStep(s => Math.min(s + 1, 4))
  }

  const handlePrev = () => setCurrentStep(s => Math.max(s - 1, 1))

  const handleChange = (e) => {
    const { name } = e.target
    setErrors(prev => ({ ...prev, [name]: undefined }))
    onInputChange(e)
  }

  const handleTipoClick = (value) => {
    setErrors(prev => ({ ...prev, tipo_problema: undefined }))
    onInputChange({ target: { name: 'tipo_problema', value } })
  }

  const handleTipoActividadClick = (value) => {
    onInputChange({ target: { name: 'tipo_actividad', value } })
  }

  const handleSave = (e) => {
    e?.preventDefault()
    if (submitting) return
    if (!validate()) return
    onSubmit()
  }

  const onCancel = () => {
    if (formDirty) { setConfirmClose(true) } else { onClose() }
  }

  const isStepValid = validateStep(currentStep)

  const stepBar = (
    <div className="w-[180px] shrink-0 border-r bg-gray-50 flex flex-col items-center py-8 px-3">
      {STEPS.map((step, idx) => {
        const StepIcon = step.icon
        const isCompleted = currentStep > step.id
        const isActive = currentStep === step.id
        const isPending = currentStep < step.id
        return (
          <div key={step.id} className="flex flex-col items-center w-full">
            <div className="flex items-center gap-3 w-full">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-200
                ${isCompleted ? 'bg-green-500 text-white' : ''}
                ${isActive ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-2' : ''}
                ${isPending ? 'border-2 border-gray-300 bg-white text-gray-400' : ''}
              `}>
                {isCompleted ? <CheckmarkCircleRegular style={{ fontSize: 14 }} /> : step.id}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`
                  text-xs font-semibold leading-tight transition-colors duration-200
                  ${isActive ? 'text-blue-700' : ''}
                  ${isCompleted ? 'text-green-700' : ''}
                  ${isPending ? 'text-gray-400' : ''}
                `}>
                  {step.label}
                </span>
                <span className={`
                  text-[10px] leading-tight
                  ${isActive || isCompleted ? 'text-gray-500' : 'text-gray-300'}
                `}>
                  {step.subtitle}
                </span>
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`
                w-0.5 h-8 my-2 ml-[-28px] transition-colors duration-200
                ${isCompleted ? 'bg-green-400' : 'bg-gray-300'}
              `} />
            )}
          </div>
        )
      })}
    </div>
  )

  const stepContent = (
    <div className="flex-1 min-w-0 p-6 overflow-y-auto">
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Tipo de Actividad</h3>
            <p className="text-sm text-gray-500">Selecciona qué tipo de actividad deseas registrar</p>
          </div>
          {touched.tipo_actividad && !formData.tipo_actividad && (
            <p className="text-xs text-red-500 mb-1">Selecciona un tipo de actividad</p>
          )}
          <div className="space-y-2">
            {TIPO_ACTIVIDAD_OPTS.map(t => (
              <Button
                key={t.value}
                appearance="outline"
                size="small"
                className={`!w-full !justify-start !h-auto !min-h-0 !text-left !py-3 !px-4 !border ${
                  formData.tipo_actividad === t.value
                    ? '!ring-2 !ring-blue-500 !ring-offset-1 !border-blue-500 !bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                onClick={() => handleTipoActividadClick(t.value)}
              >
                <div>
                  <div className="text-sm font-medium">
                    <span className="mr-2">{t.icon}</span>
                    {t.label}
                  </div>
                  <div className="text-[11px] text-gray-500 font-normal mt-0.5">{t.desc}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Responsable</h3>
            <p className="text-sm text-gray-500">Selecciona la persona y ubicación relacionada</p>
          </div>
          <Field label="Persona *" required validationMessage={touched.persona_id && errors.persona_id ? errors.persona_id : undefined}>
            <Select name="persona_id" value={formData.persona_id} onChange={handleChange}>
              <option value="">-- Seleccionar persona --</option>
              {personas.map(p => (
                <option key={p.id} value={p.id}>{personaLabel(p)}</option>
              ))}
            </Select>
          </Field>
          {(formData.tipo_actividad !== 'correo' && formData.tipo_actividad !== 'contrasena') && (
            <Field label="Ambiente *" required validationMessage={touched.ambiente_id && errors.ambiente_id ? errors.ambiente_id : undefined}>
              <Select name="ambiente_id" value={formData.ambiente_id} onChange={handleChange}>
                <option value="">-- Seleccionar ambiente --</option>
                {ambientes.map(a => (
                  <option key={a.id} value={a.id}>{ambienteLabel(a)}</option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Detalles</h3>
            {formData.tipo_actividad === 'incidencia' && (
              <p className="text-sm text-gray-500">Selecciona el tipo de problema y describe lo ocurrido</p>
            )}
            {formData.tipo_actividad === 'publicacion' && (
              <p className="text-sm text-gray-500">Ingresa el título y la URL de la publicación</p>
            )}
            {formData.tipo_actividad === 'correo' && (
              <p className="text-sm text-gray-500">Indica la cuenta creada y detalles adicionales</p>
            )}
            {formData.tipo_actividad === 'contrasena' && (
              <p className="text-sm text-gray-500">Indica el usuario y detalles del restablecimiento</p>
            )}
            {formData.tipo_actividad === 'otra' && (
              <p className="text-sm text-gray-500">Describe la actividad realizada</p>
            )}
          </div>

          {/* Incidencia: tipo_problema grid + descripcion requerida */}
          {formData.tipo_actividad === 'incidencia' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_PROBLEMA.map(t => (
                  <Button
                    key={t.value}
                    appearance="outline"
                    size="small"
                    className={`!text-xs !px-3 !py-2 !rounded-lg !justify-start !h-auto !min-h-0 !border ${
                      formData.tipo_problema === t.value
                        ? '!ring-2 !ring-blue-500 !ring-offset-1 ' + t.color
                        : t.color + ' opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => handleTipoClick(t.value)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
              {touched.tipo_problema && errors.tipo_problema && (
                <p className="text-xs text-red-500">{errors.tipo_problema}</p>
              )}
              {formData.tipo_problema === 'Otro' && (
                <Field
                  label="Especificar otro problema"
                  required
                  validationMessage={
                    touched.descripcion_otro && !formData.descripcion_otro?.trim()
                      ? 'Describe el problema reportado'
                      : undefined
                  }
                >
                  <Input
                    name="tipo_problema_otro"
                    value={formData.tipo_problema === 'Otro' ? formData.descripcion_otro || '' : ''}
                    onChange={(e) => onInputChange({ target: { name: 'descripcion_otro', value: e.target.value } })}
                    placeholder="Describe el problema..."
                  />
                </Field>
              )}
              <Field label="Descripción *" required validationMessage={touched.descripcion && errors.descripcion ? errors.descripcion : undefined}>
                <Textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe el problema reportado..."
                  rows={4}
                />
              </Field>
              <Checkbox
                name="requiere_seguimiento"
                checked={formData.requiere_seguimiento}
                onChange={(_e, data) => onInputChange({ target: { name: 'requiere_seguimiento', type: 'checkbox', checked: data.checked } })}
                label="Requiere seguimiento posterior"
              />
            </>
          )}

          {/* Publicacion: URL + Título */}
          {formData.tipo_actividad === 'publicacion' && (
            <>
              <Field label="Título de la publicación *" required validationMessage={touched.descripcion && errors.descripcion ? errors.descripcion : undefined}>
                <Input
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Ej. Convocatoria CAS N° 001-2026"
                />
              </Field>
              <Field label="URL de publicación (opcional)">
                <Input
                  name="url_publicacion"
                  value={formData.url_publicacion || ''}
                  onChange={(e) => onInputChange({ target: { name: 'url_publicacion', value: e.target.value } })}
                  placeholder="https://..."
                />
              </Field>
            </>
          )}

          {/* Correo: cuenta + descripcion opcional */}
          {formData.tipo_actividad === 'correo' && (
            <>
              <Field label="Cuenta creada">
                <Input
                  name="cuenta_creada"
                  value={formData.cuenta_creada || ''}
                  onChange={(e) => onInputChange({ target: { name: 'cuenta_creada', value: e.target.value } })}
                  placeholder="ej. usuario@ugel.gob.pe"
                />
              </Field>
              <Field label="Descripción (opcional)" validationMessage={touched.descripcion && errors.descripcion ? errors.descripcion : undefined}>
                <Textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Motivo o detalle de la creación (opcional)..."
                  rows={3}
                />
              </Field>
            </>
          )}

          {/* Contrasena: usuario + descripcion opcional */}
          {formData.tipo_actividad === 'contrasena' && (
            <>
              <Field label="Usuario / Correo">
                <Input
                  name="usuario_restablecido"
                  value={formData.usuario_restablecido || ''}
                  onChange={(e) => onInputChange({ target: { name: 'usuario_restablecido', value: e.target.value } })}
                  placeholder="Usuario o correo al que se restableció"
                />
              </Field>
              <Field label="Descripción (opcional)" validationMessage={touched.descripcion && errors.descripcion ? errors.descripcion : undefined}>
                <Textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Detalle adicional (opcional)..."
                  rows={3}
                />
              </Field>
            </>
          )}

          {/* Otra: descripcion requerida */}
          {formData.tipo_actividad === 'otra' && (
            <Field label="Descripción *" required validationMessage={touched.descripcion && errors.descripcion ? errors.descripcion : undefined}>
              <Textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe la actividad realizada..."
                rows={4}
              />
            </Field>
          )}
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Control</h3>
            {formData.tipo_actividad === 'incidencia' && (
              <p className="text-sm text-gray-500">Define la prioridad, tipo de atención y fecha</p>
            )}
            {formData.tipo_actividad === 'publicacion' && (
              <p className="text-sm text-gray-500">Configura la sección, fechas de publicación y aprobación</p>
            )}
            {formData.tipo_actividad === 'correo' && (
              <p className="text-sm text-gray-500">Indica la fecha de activación de la cuenta</p>
            )}
            {formData.tipo_actividad === 'contrasena' && (
              <p className="text-sm text-gray-500">Fecha de restablecimiento y método de entrega</p>
            )}
            {formData.tipo_actividad === 'otra' && (
              <p className="text-sm text-gray-500">Prioridad y fecha de la actividad</p>
            )}
          </div>

          {formData.tipo_actividad === 'incidencia' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prioridad">
                  <Select name="prioridad" value={formData.prioridad} onChange={onInputChange}>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo de atención">
                  <Select name="tipo_atencion" value={formData.tipo_atencion} onChange={onInputChange}>
                    <option value="Presencial">Presencial</option>
                    <option value="Remota">Remota</option>
                    <option value="Telefónica">Telefónica</option>
                  </Select>
                </Field>
                <Field label="Fecha de atención">
                  <Input name="fecha_atencion" type="date" value={formData.fecha_atencion} onChange={onInputChange} />
                </Field>
              </div>
            </>
          )}

          {formData.tipo_actividad === 'publicacion' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Sección">
                  <Select name="seccion_publicacion" value={formData.seccion_publicacion} onChange={onInputChange}>
                    <option value="">-- Seleccionar sección --</option>
                    <option value="Convocatorias">Convocatorias</option>
                    <option value="Comunicados">Comunicados</option>
                    <option value="Documentos">Documentos</option>
                    <option value="Normativas">Normativas</option>
                    <option value="Otro">Otro</option>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha de publicación">
                  <Input name="fecha_publicacion" type="date" value={formData.fecha_publicacion} onChange={onInputChange} />
                </Field>
                <Field label="Fecha de expiración (opcional)">
                  <Input name="fecha_expiracion" type="date" value={formData.fecha_expiracion} onChange={onInputChange} />
                </Field>
              </div>
            </>
          )}

          {formData.tipo_actividad === 'correo' && (
            <Field label="Fecha de activación">
              <Input name="fecha_activacion" type="date" value={formData.fecha_activacion} onChange={onInputChange} />
            </Field>
          )}

          {formData.tipo_actividad === 'contrasena' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha de restablecimiento">
                  <Input name="fecha_restablecimiento" type="date" value={formData.fecha_restablecimiento} onChange={onInputChange} />
                </Field>
                <Field label="Entregada por">
                  <Select name="entregada_por" value={formData.entregada_por} onChange={onInputChange}>
                    <option value="">-- Seleccionar --</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Teléfono">Teléfono</option>
                    <option value="Correo electrónico">Correo electrónico</option>
                  </Select>
                </Field>
              </div>
            </>
          )}

          {formData.tipo_actividad === 'otra' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prioridad">
                <Select name="prioridad" value={formData.prioridad} onChange={onInputChange}>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </Select>
              </Field>
              <Field label="Fecha">
                <Input name="fecha_atencion" type="date" value={formData.fecha_atencion} onChange={onInputChange} />
              </Field>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <Drawer position="end" open={open} onOpenChange={(_, data) => { if (!data.open) onCancel() }} size="large">
      <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
        <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={onCancel} />}>
          {editMode ? (
            <div>
              <span className="text-lg font-bold text-slate-800 inline-flex items-center gap-2">
                <EditRegular /> Editar Atención
                {numeroTicket && (
                  <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    🧾 {numeroTicket}
                  </span>
                )}
              </span>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                Actualiza los datos de la atención
                {createdAt && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <ClockRegular style={{ fontSize: 11 }} />
                    {diffHumano(createdAt)}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div>
              <span className="text-lg font-bold text-slate-800 inline-flex items-center gap-2">
                <AddRegular /> Nueva Atención
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                Paso {currentStep} de 4 — {STEPS[currentStep - 1].subtitle}
              </p>
            </div>
          )}
        </DrawerHeaderTitle>
      </DrawerHeader>

      {editMode ? (
        <>
          <DrawerBody className="p-6 space-y-6">
            <div className="mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo de actividad</span>
              <p className="text-sm font-medium text-gray-800">
                {TIPO_ACTIVIDAD_OPTS.find(t => t.value === formData.tipo_actividad)?.icon} {TIPO_ACTIVIDAD_OPTS.find(t => t.value === formData.tipo_actividad)?.label || formData.tipo_actividad || '—'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Field label="Persona *" required validationMessage={touched.persona_id && errors.persona_id ? errors.persona_id : undefined}>
                <Select name="persona_id" value={formData.persona_id} onChange={handleChange}>
                  <option value="">-- Seleccionar persona --</option>
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>{personaLabel(p)}</option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* Incidencia fields */}
            {formData.tipo_actividad === 'incidencia' && (
              <>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS_PROBLEMA.map(t => (
                      <Button
                        key={t.value}
                        appearance="outline"
                        size="small"
                        className={`!text-xs !px-3 !py-2 !rounded-lg !justify-start !h-auto !min-h-0 !border ${
                          formData.tipo_problema === t.value
                            ? '!ring-2 !ring-blue-500 !ring-offset-1 ' + t.color
                            : t.color + ' opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => handleTipoClick(t.value)}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                  {touched.tipo_problema && errors.tipo_problema && (
                    <p className="text-xs text-red-500">{errors.tipo_problema}</p>
                  )}
                  {formData.tipo_problema === 'Otro' && (
                    <Field
                      label="Especificar otro problema"
                      required
                      validationMessage={
                        touched.descripcion_otro && !formData.descripcion_otro?.trim()
                          ? 'Describe el problema reportado'
                          : undefined
                      }
                    >
                      <Input
                        name="tipo_problema_otro"
                        value={formData.tipo_problema === 'Otro' ? formData.descripcion_otro || '' : ''}
                        onChange={(e) => onInputChange({ target: { name: 'descripcion_otro', value: e.target.value } })}
                        placeholder="Describe el problema..."
                      />
                    </Field>
                  )}
                </div>

                <div className="flex flex-col gap-3">
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

                <div className="flex flex-col gap-3">
                  <Field label="Ambiente *" required validationMessage={touched.ambiente_id && errors.ambiente_id ? errors.ambiente_id : undefined}>
                    <Select name="ambiente_id" value={formData.ambiente_id} onChange={handleChange}>
                      <option value="">-- Seleccionar ambiente --</option>
                      {ambientes.map(a => (
                        <option key={a.id} value={a.id}>{ambienteLabel(a)}</option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tipo de atención">
                    <Select name="tipo_atencion" value={formData.tipo_atencion} onChange={onInputChange}>
                      <option value="Presencial">Presencial</option>
                      <option value="Remota">Remota</option>
                      <option value="Telefónica">Telefónica</option>
                    </Select>
                  </Field>
                  <Field label="Requiere seguimiento">
                    <Checkbox
                      name="requiere_seguimiento"
                      checked={formData.requiere_seguimiento}
                      onChange={(_e, data) => onInputChange({ target: { name: 'requiere_seguimiento', type: 'checkbox', checked: data.checked } })}
                      label="Sí, requiere seguimiento posterior"
                    />
                  </Field>
                </div>
              </>
            )}

            {/* Publicacion fields */}
            {formData.tipo_actividad === 'publicacion' && (
              <>
                <Field label="Título de la publicación *" required validationMessage={touched.descripcion && errors.descripcion ? errors.descripcion : undefined}>
                  <Input
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Ej. Convocatoria CAS N° 001-2026"
                  />
                </Field>
                <Field label="URL de publicación (opcional)">
                  <Input
                    name="url_publicacion"
                    value={formData.url_publicacion || ''}
                    onChange={(e) => onInputChange({ target: { name: 'url_publicacion', value: e.target.value } })}
                    placeholder="https://..."
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                <Field label="Sección">
                  <Select name="seccion_publicacion" value={formData.seccion_publicacion} onChange={onInputChange}>
                    <option value="">-- Seleccionar sección --</option>
                    <option value="Convocatorias">Convocatorias</option>
                    <option value="Comunicados">Comunicados</option>
                    <option value="Documentos">Documentos</option>
                    <option value="Normativas">Normativas</option>
                    <option value="Otro">Otro</option>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha de publicación">
                  <Input name="fecha_publicacion" type="date" value={formData.fecha_publicacion} onChange={onInputChange} />
                </Field>
                <Field label="Fecha de expiración (opcional)">
                  <Input name="fecha_expiracion" type="date" value={formData.fecha_expiracion} onChange={onInputChange} />
                </Field>
              </div>
            </>
          )}

            {/* Correo fields */}
            {formData.tipo_actividad === 'correo' && (
              <>
                <Field label="Cuenta creada">
                  <Input
                    name="cuenta_creada"
                    value={formData.cuenta_creada || ''}
                    onChange={(e) => onInputChange({ target: { name: 'cuenta_creada', value: e.target.value } })}
                    placeholder="ej. usuario@ugel.gob.pe"
                  />
                </Field>
                <Field label="Descripción (opcional)" validationMessage={touched.descripcion && errors.descripcion ? errors.descripcion : undefined}>
                  <Textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Motivo o detalle de la creación (opcional)..."
                    rows={3}
                  />
                </Field>
                <Field label="Fecha de activación">
                  <Input name="fecha_activacion" type="date" value={formData.fecha_activacion} onChange={onInputChange} />
                </Field>
              </>
            )}

            {/* Contrasena fields */}
            {formData.tipo_actividad === 'contrasena' && (
              <>
                <Field label="Usuario / Correo">
                  <Input
                    name="usuario_restablecido"
                    value={formData.usuario_restablecido || ''}
                    onChange={(e) => onInputChange({ target: { name: 'usuario_restablecido', value: e.target.value } })}
                    placeholder="Usuario o correo al que se restableció"
                  />
                </Field>
                <Field label="Descripción (opcional)" validationMessage={touched.descripcion && errors.descripcion ? errors.descripcion : undefined}>
                  <Textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Detalle adicional (opcional)..."
                    rows={3}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Fecha de restablecimiento">
                    <Input name="fecha_restablecimiento" type="date" value={formData.fecha_restablecimiento} onChange={onInputChange} />
                  </Field>
                  <Field label="Entregada por">
                    <Select name="entregada_por" value={formData.entregada_por} onChange={onInputChange}>
                      <option value="">-- Seleccionar --</option>
                      <option value="Presencial">Presencial</option>
                      <option value="Teléfono">Teléfono</option>
                      <option value="Correo electrónico">Correo electrónico</option>
                    </Select>
                  </Field>
                </div>
              </>
            )}

            {/* Otra fields */}
            {formData.tipo_actividad === 'otra' && (
              <>
                <Field label="Descripción *" required validationMessage={touched.descripcion && errors.descripcion ? errors.descripcion : undefined}>
                  <Textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Describe la actividad realizada..."
                    rows={3}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Prioridad">
                    <Select name="prioridad" value={formData.prioridad} onChange={onInputChange}>
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </Select>
                  </Field>
                  <Field label="Fecha">
                    <Input name="fecha_atencion" type="date" value={formData.fecha_atencion} onChange={onInputChange} />
                  </Field>
                </div>
              </>
            )}

            {/* Shared: Estado (except for publicacion) */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Estado">
                <Select name="estado" value={formData.estado} onChange={onInputChange}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Resuelto">Resuelto</option>
                  <option value="Completado">Completado</option>
                  <option value="Cerrado">Cerrado</option>
                </Select>
              </Field>
              {(formData.tipo_actividad === 'incidencia') && (
                <Field label="Prioridad">
                  <Select name="prioridad" value={formData.prioridad} onChange={onInputChange}>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </Select>
                </Field>
              )}
            </div>

            {(formData.estado === 'Resuelto' || formData.estado === 'Cerrado' || formData.estado === 'Completado') && (
              <Field label="Fecha de cierre">
                <Input name="fecha_cierre" type="date" value={formData.fecha_cierre} onChange={onInputChange} />
              </Field>
            )}
          </DrawerBody>

          <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <Button appearance="secondary" onClick={onCancel}>Cancelar</Button>
            <Button appearance="primary" icon={<AddRegular />} onClick={handleSave} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Actualizar'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <DrawerBody className="p-0 flex min-h-0">
            {stepBar}
            {stepContent}
          </DrawerBody>

          <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <Button appearance="subtle" onClick={handlePrev} disabled={submitting}>
                  ← Anterior
                </Button>
              )}
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-xs text-gray-400">
                {currentStep < 4 ? `Paso ${currentStep} de 4` : 'Último paso'}
              </span>
              <Button appearance="secondary" onClick={onCancel} disabled={submitting}>
                Cancelar
              </Button>
              {currentStep < 4 ? (
                <Button appearance="primary" onClick={handleNext} disabled={!isStepValid || submitting}>
                  Siguiente →
                </Button>
              ) : (
                <Button appearance="primary" icon={<AddRegular />} onClick={handleSave} disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Registrar Atención'}
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      <Dialog open={confirmClose} onOpenChange={(_, d) => setConfirmClose(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>¿Descartar cambios?</DialogTitle>
            <DialogContent>
              Hay cambios sin guardar. Si cierras ahora, se perderán los datos modificados.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={handleCancelClose}>
                Seguir editando
              </Button>
              <Button appearance="primary" onClick={handleConfirmClose}>
                Descartar cambios
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </Drawer>
  )
}

export default DrawerBitacora