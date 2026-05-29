import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'
import {
  AddRegular,
  EditRegular,
  DeleteRegular,
  SearchRegular,
  ArrowSyncRegular,
  DismissRegular,
  MailRegular,
  PhoneRegular,
  ContactCardRegular, // Usaremos este mismo que ya funciona
  BriefcaseRegular
} from '@fluentui/react-icons'
import {
  Button,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  Input,
  Field,
  Divider,
  Subtitle2,
  Caption1,
  Avatar,
  Card,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle
} from '@fluentui/react-components'

const Personas = () => {
  const [personas, setPersonas] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState(null)
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    cargo: '',
    email: '',
    telefono: '',
    area_id: ''
  })

  const { dispatchToast } = useToastController()

  useEffect(() => {
    cargarPersonas()
  }, [])

  const cargarPersonas = async () => {
    try {
      setLoading(true)
      const [personasResult, areasResult] = await Promise.all([
        supabase.from('personas').select('*, area:areas(*)').order('created_at', { ascending: false }),
        supabase.from('areas').select('*').order('nombre')
      ])

      if (personasResult.error) throw personasResult.error
      if (areasResult.error) throw areasResult.error
      setPersonas(personasResult.data || [])
      setAreas(areasResult.data || [])
    } catch (error) {
      mostrarToast(handleApiError(error, 'cargar datos'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const mostrarToast = (mensaje, tipo = 'success') => {
    dispatchToast(
      <Toast>
        <ToastTitle>{tipo === 'success' ? '✅ Éxito' : '❌ Error'}</ToastTitle>
        <ToastBody>{mensaje}</ToastBody>
      </Toast>,
      { intent: tipo }
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const validarDNI = (dni) => {
    const dniRegex = /^[0-9]{8}$/
    return dniRegex.test(dni)
  }

  const handleSubmit = async () => {
    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.dni.trim()) {
      mostrarToast('Nombres, Apellidos y DNI son obligatorios', 'error')
      return
    }
    if (!validarDNI(formData.dni)) {
      mostrarToast('El DNI debe tener exactamente 8 dígitos', 'error')
      return
    }

    try {
      if (editMode) {
        const { error } = await supabase
          .from('personas')
          .update({
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            dni: formData.dni,
            cargo: formData.cargo,
            email: formData.email,
            telefono: formData.telefono,
            area_id: formData.area_id || null
          })
          .eq('id', selectedPersona.id)

        if (error) throw error
        mostrarToast('Persona actualizada correctamente')
      } else {
        // Verificar duplicados de DNI
        const { data: existing } = await supabase
          .from('personas')
          .select('dni')
          .eq('dni', formData.dni)

        if (existing && existing.length > 0) {
          mostrarToast('Ya existe una persona con ese DNI', 'error')
          return
        }

        const { error } = await supabase
          .from('personas')
          .insert([{ ...formData, area_id: formData.area_id || null }])

        if (error) throw error
        mostrarToast('Persona registrada correctamente')
      }

      setOpenDrawer(false)
      resetForm()
      cargarPersonas()
    } catch (error) {
      mostrarToast(handleApiError(error, 'guardar persona'), 'error')
    }
  }

  const handleEdit = (persona) => {
    setEditMode(true)
    setSelectedPersona(persona)
    setFormData({
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      dni: persona.dni,
      cargo: persona.cargo || '',
      email: persona.email || '',
      telefono: persona.telefono || '',
      area_id: persona.area_id || ''
    })
    setOpenDrawer(true)
  }

  const handleDelete = async (id, nombreCompleto) => {
    if (confirm(`¿Estás seguro de eliminar a ${nombreCompleto}?`)) {
      try {
        const { data: asignaciones } = await supabase
          .from('asignaciones')
          .select('id')
          .eq('persona_id', id)

        if (asignaciones && asignaciones.length > 0) {
          mostrarToast('No se puede eliminar porque tiene bienes asignados', 'error')
          return
        }

        const { error } = await supabase
          .from('personas')
          .delete()
          .eq('id', id)

        if (error) throw error
        mostrarToast('Persona eliminada correctamente')
        cargarPersonas()
      } catch (error) {
        mostrarToast(handleApiError(error, 'eliminar persona'), 'error')
      }
    }
  }

  const resetForm = () => {
    setEditMode(false)
    setSelectedPersona(null)
    setFormData({
      nombres: '',
      apellidos: '',
      dni: '',
      cargo: '',
      email: '',
      telefono: '',
      area_id: ''
    })
  }

  const filteredPersonas = personas.filter(persona =>
    persona.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getNombreCompleto = (persona) => {
    return `${persona.apellidos} ${persona.nombres}`
  }

  return (
    <div className="p-1">
      <Toaster />

      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Personas</h1>
          <p className="text-sm text-gray-500">Administración del personal institucional y responsables de inventario</p>
        </div>
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={() => {
            resetForm()
            setOpenDrawer(true)
          }}
        >
          Nueva Persona
        </Button>
      </div>

      {/* Barra de Búsqueda Moderna */}
      <Card className="mb-6 !p-3 shadow-sm">
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <Input
              contentBefore={<SearchRegular className="text-gray-400" />}
              placeholder="Buscar por nombres, apellidos, DNI o cargo ocupado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            icon={<ArrowSyncRegular />}
            onClick={cargarPersonas}
            appearance="subtle"
          >
            Actualizar
          </Button>
        </div>
      </Card>

      {/* Tabla Principal Estilo Fluent 2 */}
      <Card className="overflow-hidden !p-0 shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            Cargando registros...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-gray-50/70">
                <TableRow>
                  <TableHeaderCell><span className="font-semibold text-gray-700">Apellidos y Nombres</span></TableHeaderCell>
                  <TableHeaderCell><span className="font-semibold text-gray-700">DNI</span></TableHeaderCell>
                  <TableHeaderCell><span className="font-semibold text-gray-700">Cargo</span></TableHeaderCell>
                  <TableHeaderCell><span className="font-semibold text-gray-700">Área</span></TableHeaderCell>
                  <TableHeaderCell><span className="font-semibold text-gray-700">Contacto</span></TableHeaderCell>
                  <TableHeaderCell className="text-center"><span className="font-semibold text-gray-700">Acciones</span></TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersonas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-400 italic">
                      No hay personas registradas que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPersonas.map((persona) => (
                    <TableRow key={persona.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3 py-1.5">
                          <Avatar
                            name={getNombreCompleto(persona)}
                            size={32}
                            color="brand"
                          />
                          <span className="font-medium text-gray-800">{getNombreCompleto(persona)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                          {persona.dni}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-700">{persona.cargo || <span className="text-gray-300 italic text-xs">No asignado</span>}</TableCell>
                      <TableCell>
                        {persona.area?.nombre ? (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                            {persona.area.nombre}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic text-xs">Sin área</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                          {persona.email && <span className="flex items-center gap-1"><MailRegular className="text-gray-400" /> {persona.email}</span>}
                          {persona.telefono && <span className="flex items-center gap-1"><PhoneRegular className="text-gray-400" /> {persona.telefono}</span>}
                          {!persona.email && !persona.telefono && <span className="text-gray-300 italic">Sin datos</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button
                            appearance="subtle"
                            icon={<EditRegular className="text-blue-600" />}
                            onClick={() => handleEdit(persona)}
                            size="small"
                            title="Editar"
                          />
                          <Button
                            appearance="subtle"
                            icon={<DeleteRegular className="text-red-600" />}
                            onClick={() => handleDelete(persona.id, getNombreCompleto(persona))}
                            size="small"
                            title="Eliminar"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* PANEL LATERAL INTEGRADO (DRAWER CON VISTA FOTOCHECK) */}
      <Drawer
        position="end"
        open={openDrawer}
        onOpenChange={(_, data) => setOpenDrawer(data.open)}
        style={{ width: '820px', maxWidth: '95vw' }}
      >
        <DrawerHeader className="border-b border-gray-100">
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={() => setOpenDrawer(false)}
              />
            }
          >
            {editMode ? 'Actualizar Ficha de Personal' : 'Registrar Nuevo Personal'}
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody className="!p-0 flex h-full overflow-hidden">

          {/* SECCIÓN FORMULARIO (60%) */}
          <div className="w-7/12 p-5 overflow-y-auto border-r border-gray-100 flex flex-col gap-5 pb-16">

            {/* Bloque 1: Identidad */}
            <div className="flex flex-col gap-3">
              <Subtitle2 className="text-blue-700 flex items-center gap-1">
                <ContactCardRegular style={{ fontSize: '16px' }} /> Datos de Identidad
              </Subtitle2>
              <Divider color="brand" />
              <div className="flex flex-col gap-3">
                <Field label="Nombres" required>
                  <Input name="nombres" value={formData.nombres} onChange={handleInputChange} placeholder="Ej. Juan Carlos" autoComplete="off" />
                </Field>
                <Field label="Apellidos" required>
                  <Input name="apellidos" value={formData.apellidos} onChange={handleInputChange} placeholder="Ej. Pérez Gonzales" autoComplete="off" />
                </Field>
                <Field label="DNI (Documento de Identidad)" required>
                  <Input
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    placeholder="8 dígitos obligatorios"
                    maxLength={8}
                    className="font-mono"
                  />
                </Field>
              </div>
            </div>

            {/* Bloque 2: Estructura Laboral */}
            <div className="flex flex-col gap-3">
              <Subtitle2 className="text-blue-700 flex items-center gap-1">
                <BriefcaseRegular style={{ fontSize: '16px' }} /> Ubicación Institucional
              </Subtitle2>
              <Divider />
              <Field label="Cargo / Rol Funcional">
                <Input name="cargo" value={formData.cargo} onChange={handleInputChange} placeholder="Ej. Especialista de TI, Jefe de Almacén..." />
              </Field>
              <Field label="Área">
                <select
                  name="area_id"
                  value={formData.area_id}
                  onChange={handleInputChange}
                  className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                >
                  <option value="">-- Seleccionar área --</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Bloque 3: Canales de Contacto */}
            <div className="flex flex-col gap-3">
              <Subtitle2 className="text-blue-700 flex items-center gap-1">
                <MailRegular style={{ fontSize: '16px' }} /> Datos de Comunicación
              </Subtitle2>
              <Divider />
              <div className="grid grid-cols-1 gap-3">
                <Field label="Correo Electrónico">
                  <Input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="ejemplo@institucion.gob.pe" />
                </Field>
                <Field label="Teléfono Fijo / Celular">
                  <Input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="Ej. 987654321" />
                </Field>
              </div>
            </div>
          </div>

          {/* VISTA PREVIA ESTILO FOTOCHECK DIGITAL (40%) */}
          <div className="w-5/12 bg-gray-50 p-6 flex flex-col justify-between h-full border-l border-gray-100 items-center">

            <div className="w-full text-left self-start">
              <Caption1 className="uppercase tracking-widest font-semibold text-gray-400">Credencial Institucional Activa</Caption1>
            </div>

            {/* DISEÑO DEL FOTOCHECK ANIMADO */}
            <div className="w-60 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative flex flex-col items-center my-auto transform hover:scale-105 transition-transform duration-300">

              {/* Encabezado del Fotocheck */}
              <div className="w-full bg-slate-900 h-14 relative flex flex-col items-center justify-center text-center">
                <span className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">CONTROL INTERNO</span>
                <span className="text-[10px] text-white font-medium tracking-normal">INVENTARIO GENERAL</span>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              </div>

              {/* Slot superior simulado para el clip del colgador */}
              <div className="w-10 h-2 bg-gray-200 rounded-full mt-3 border border-gray-300/60 shadow-inner"></div>

              {/* Contenedor del Avatar */}
              <div className="mt-4 mb-2 relative">
                <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-full shadow-md">
                  <div className="p-0.5 bg-white rounded-full">
                    <Avatar
                      name={formData.nombres || formData.apellidos ? `${formData.apellidos} ${formData.nombres}` : "P"}
                      size={64}
                      color="brand"
                    />
                  </div>
                </div>
              </div>

              {/* Textos del Fotocheck */}
              <div className="px-4 text-center flex-1 w-full flex flex-col justify-between pb-5">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase leading-tight tracking-wide line-clamp-2 px-1">
                    {formData.nombres || formData.apellidos
                      ? `${formData.nombres} ${formData.apellidos}`
                      : 'NOMBRES Y APELLIDOS'}
                  </h3>

                  {/* Badge de Rol Funcional */}
                  <div className="inline-block bg-blue-50 text-blue-700 rounded-full text-[9px] font-bold px-2.5 py-0.5 mt-2 max-w-[90%] truncate border border-blue-100">
                    {formData.cargo ? formData.cargo.toUpperCase() : 'PERSONAL REGISTRADO'}
                  </div>
                </div>

                {/* Bloque de Identificación Técnico en la base del fotocheck */}
                <div className="mt-5 pt-3 border-t border-dashed border-gray-200 text-[10px] text-gray-600 space-y-1 bg-gray-50/70 p-2 rounded-xl text-left font-sans">
                  <div className="flex items-center gap-1.5 truncate">
                    {/* 🔄 Reemplazamos aquí usando ContactCardRegular que ya está importado arriba */}
                    <ContactCardRegular className="text-blue-600 shrink-0" style={{ fontSize: '13px' }} />
                    <span className="font-semibold text-gray-700 font-mono">DNI: {formData.dni || '••••••••'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MailRegular className="text-gray-400 shrink-0" style={{ fontSize: '13px' }} />
                    <span className="text-gray-500 truncate">{formData.email || 'Sin correo registrado'}</span>
                  </div>
                </div>
              </div>

              {/* Línea decorativa inferior */}
              <div className="w-full h-1 bg-blue-600"></div>
            </div>

            {/* Botones de acción inferiores fijos */}
            <div className="w-full flex gap-2 justify-end bg-white border-t border-gray-100 p-4 -mx-6 -mb-6 mt-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
              <Button appearance="secondary" onClick={() => setOpenDrawer(false)}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleSubmit}>
                {editMode ? 'Actualizar Ficha' : 'Registrar Alta'}
              </Button>
            </div>
          </div>

        </DrawerBody>
      </Drawer>
    </div>
  )
}

export default Personas



















