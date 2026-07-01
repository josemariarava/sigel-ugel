import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'

export const diffHumano = (desde, hasta = new Date()) => {
  const ms = hasta.getTime() - new Date(desde).getTime()
  if (ms < 0) return '—'
  const seg = Math.floor(ms / 1000)
  if (seg < 60) return 'ahora'
  const min = Math.floor(seg / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`
  const d = Math.floor(h / 24)
  const hr = h % 24
  if (d < 30) return hr ? `${d}d ${hr}h` : `${d}d`
  const meses = Math.floor(d / 30)
  return meses >= 12 ? `${Math.floor(meses / 12)} años` : `${meses} meses`
}

const useBitacora = () => {
  const [atenciones, setAtenciones] = useState([])
  const [personas, setPersonas] = useState([])
  const [ambientes, setAmbientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState(null)
  const [filtroPrioridad, setFiltroPrioridad] = useState(null)
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [filtroTipo, setFiltroTipo] = useState(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedAtencion, setSelectedAtencion] = useState(null)
  const [currentUser, setCurrentUser] = useState('')

  const submittingRef = useRef(false)

  const PAGE_SIZE = 25
  const [currentPage, setCurrentPage] = useState(1)

  const [tick, setTick] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const emptyForm = {
    persona_id: '',
    ambiente_id: '',
    tipo_problema: '',
    tipo_atencion: 'Presencial',
    descripcion: '',
    descripcion_otro: '',
    solucion: '',
    prioridad: 'Media',
    estado: 'Pendiente',
    fecha_atencion: new Date().toISOString().split('T')[0],
    fecha_cierre: '',
    requiere_seguimiento: false,
    tipo_actividad: 'incidencia',
    url_publicacion: '',
    cuenta_creada: '',
    usuario_restablecido: '',
    seccion_publicacion: '',
    fecha_expiracion: '',
    fecha_publicacion: '',
    fecha_activacion: '',
    fecha_restablecimiento: '',
    entregada_por: ''
  }

  const [formData, setFormData] = useState({ ...emptyForm })

  useEffect(() => {
    const user = supabase.auth.getSession()
    user.then(({ data }) => {
      if (data?.session?.user) {
        const meta = data.session.user.user_metadata
        setCurrentUser(meta?.nombre || data.session.user.email || '')
      }
    }).catch(() => {})
    cargarDatos()
  }, [])

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)
      const [atencionesRes, personasRes, ambientesRes] = await Promise.all([
        supabase
          .from('bitacora')
          .select('*, persona:personas(*), ambiente:ambientes(*, piso:pisos(*), area:areas(*))')
          .order('created_at', { ascending: false }),
        supabase.from('personas').select('*, area:areas(*)').order('apellidos'),
        supabase.from('ambientes').select('*, piso:pisos(*), area:areas(*)').order('nombre')
      ])
      if (atencionesRes.error) throw atencionesRes.error
      if (personasRes.error) throw personasRes.error
      if (ambientesRes.error) throw ambientesRes.error
      setAtenciones(atencionesRes.data || [])
      setPersonas(personasRes.data || [])
      setAmbientes(ambientesRes.data || [])
    } catch (error) {
      console.error('Error al cargar bitácora:', handleApiError(error, 'cargar datos'))
    } finally {
      setLoading(false)
    }
  }, [])

  const registrarLog = async (bitacoraId, tipo, opts = {}) => {
    const { error } = await supabase.from('bitacora_log').insert([{
      bitacora_id: bitacoraId,
      tipo_cambio: tipo,
      estado_anterior: opts.estadoAnterior || null,
      estado_nuevo: opts.estadoNuevo || null,
      usuario: currentUser,
      detalle: opts.detalle || null
    }])
    if (error) console.warn('Error al registrar log:', handleApiError(error, 'registrar log'))
  }

  const cargarLogs = async (bitacoraId) => {
    try {
      const { data, error } = await supabase
        .from('bitacora_log')
        .select('*')
        .eq('bitacora_id', bitacoraId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error al cargar logs:', handleApiError(error, 'cargar historial'))
      return []
    }
  }

  const abrirDrawer = (atencion = null) => {
    setEditMode(!!atencion)
    setSelectedAtencion(atencion)
    if (atencion) {
      const rawTipo = atencion.tipo_problema || ''
      const isOtro = rawTipo === 'Otro' || rawTipo.startsWith('Otro: ')
      setFormData({
        persona_id: atencion.persona_id || '',
        ambiente_id: atencion.ambiente_id || '',
        tipo_problema: isOtro ? 'Otro' : rawTipo,
        descripcion_otro: isOtro && rawTipo.startsWith('Otro: ') ? rawTipo.replace('Otro: ', '') : '',
        tipo_atencion: atencion.tipo_atencion || 'Presencial',
        descripcion: atencion.descripcion || '',
        solucion: atencion.solucion || '',
        prioridad: atencion.prioridad || 'Media',
        estado: atencion.estado || 'Pendiente',
        fecha_atencion: atencion.fecha_atencion || new Date().toISOString().split('T')[0],
        fecha_cierre: atencion.fecha_cierre || '',
        requiere_seguimiento: atencion.requiere_seguimiento || false,
        tipo_actividad: atencion.tipo_actividad || 'incidencia',
        url_publicacion: atencion.url_publicacion || '',
        cuenta_creada: atencion.cuenta_creada || '',
        usuario_restablecido: atencion.usuario_restablecido || '',
        seccion_publicacion: atencion.seccion_publicacion || '',
        fecha_expiracion: atencion.fecha_expiracion || '',
        fecha_publicacion: atencion.fecha_publicacion || '',
        fecha_activacion: atencion.fecha_activacion || '',
        fecha_restablecimiento: atencion.fecha_restablecimiento || '',
        entregada_por: atencion.entregada_por || ''
      })
    } else {
      setFormData({
        ...emptyForm,
        fecha_atencion: new Date().toISOString().split('T')[0]
      })
    }
    setOpenDrawer(true)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async () => {
    if (submittingRef.current) return
    submittingRef.current = true

    try {
      if (editMode) {
        const payload = {
          persona_id: formData.persona_id,
          ambiente_id: formData.ambiente_id,
          tipo_problema: formData.tipo_problema === 'Otro' && formData.descripcion_otro?.trim()
            ? `Otro: ${formData.descripcion_otro.trim()}`
            : formData.tipo_problema,
          tipo_atencion: formData.tipo_atencion,
          descripcion: formData.descripcion,
          solucion: formData.solucion || null,
          prioridad: formData.prioridad,
          estado: formData.estado,
          fecha_atencion: formData.fecha_atencion,
          fecha_cierre: formData.fecha_cierre || null,
          requiere_seguimiento: formData.requiere_seguimiento,
          tipo_actividad: formData.tipo_actividad,
          url_publicacion: formData.url_publicacion || null,
          cuenta_creada: formData.cuenta_creada || null,
          usuario_restablecido: formData.usuario_restablecido || null,
          seccion_publicacion: formData.seccion_publicacion || null,
          fecha_expiracion: formData.fecha_expiracion || null,
          fecha_publicacion: formData.fecha_publicacion || null,
          fecha_activacion: formData.fecha_activacion || null,
          fecha_restablecimiento: formData.fecha_restablecimiento || null,
          entregada_por: formData.entregada_por || null,
          updated_at: new Date().toISOString(),
          updated_by: currentUser
        }
        const { error } = await supabase
          .from('bitacora')
          .update(payload)
          .eq('id', selectedAtencion.id)
        if (error) throw error
        await registrarLog(selectedAtencion.id, 'editado')
      } else {
        const anio = new Date().getFullYear()
        const payload = {
          persona_id: formData.persona_id,
          ambiente_id: formData.ambiente_id,
          tipo_problema: formData.tipo_problema === 'Otro' && formData.descripcion_otro?.trim()
            ? `Otro: ${formData.descripcion_otro.trim()}`
            : formData.tipo_problema,
          tipo_atencion: formData.tipo_atencion,
          descripcion: formData.descripcion,
          prioridad: formData.prioridad,
          estado: 'Pendiente',
          fecha_atencion: formData.fecha_atencion,
          requiere_seguimiento: formData.requiere_seguimiento,
          tipo_actividad: formData.tipo_actividad,
          url_publicacion: formData.url_publicacion || null,
          cuenta_creada: formData.cuenta_creada || null,
          usuario_restablecido: formData.usuario_restablecido || null,
          seccion_publicacion: formData.seccion_publicacion || null,
          fecha_expiracion: formData.fecha_expiracion || null,
          fecha_publicacion: formData.fecha_publicacion || null,
          fecha_activacion: formData.fecha_activacion || null,
          fecha_restablecimiento: formData.fecha_restablecimiento || null,
          entregada_por: formData.entregada_por || null,
          atendido_por: currentUser
        }
        let inserted
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data: maxData } = await supabase
            .from('bitacora')
            .select('numero_ticket')
            .like('numero_ticket', `TKT-${anio}-%`)
            .order('numero_ticket', { ascending: false })
            .limit(1)
          let nextNum = 1
          if (maxData && maxData.length > 0) {
            const lastNum = parseInt(maxData[0].numero_ticket.split('-')[2], 10)
            nextNum = !isNaN(lastNum) ? lastNum + 1 : 1
          }
          const ticket = `TKT-${anio}-${String(nextNum).padStart(4, '0')}`
          const { data, error } = await supabase
            .from('bitacora')
            .insert([{ ...payload, numero_ticket: ticket }])
            .select()
          if (error) {
            if (error.code === '23505' && attempt < 2) continue
            throw error
          }
          inserted = data[0]
          break
        }
        if (inserted) {
          await registrarLog(inserted.id, 'creado')
        }
      }
      setOpenDrawer(false)
      await cargarDatos()
    } finally {
      submittingRef.current = false
    }
  }

  const handleDelete = async (id) => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const { data: current } = await supabase
        .from('bitacora')
        .select('estado')
        .eq('id', id)
        .single()
      await registrarLog(id, 'eliminado', { estadoAnterior: current?.estado || null })
      const { error } = await supabase.from('bitacora').delete().eq('id', id)
      if (error) throw error
      await cargarDatos()
    } finally {
      submittingRef.current = false
    }
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const { data: current } = await supabase
        .from('bitacora')
        .select('estado')
        .eq('id', id)
        .single()
      const estadoAnterior = current?.estado || null
      const payload = {
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
        updated_by: currentUser
      }
      if (nuevoEstado === 'Cerrado' || nuevoEstado === 'Resuelto' || nuevoEstado === 'Completado') {
        payload.fecha_cierre = new Date().toISOString().split('T')[0]
      }
      const { error } = await supabase.from('bitacora').update(payload).eq('id', id)
      if (error) throw error
      await registrarLog(id, 'cambio_estado', { estadoAnterior, estadoNuevo: nuevoEstado })
      await cargarDatos()
    } catch (error) {
      console.error('Error al cambiar estado:', handleApiError(error, 'actualizar estado'))
    } finally {
      submittingRef.current = false
    }
  }

  const resolverAtencion = async (id, solucion) => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const { error } = await supabase
        .from('bitacora')
        .update({
          estado: 'Resuelto',
          solucion: solucion || null,
          fecha_cierre: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
          updated_by: currentUser
        })
        .eq('id', id)
      if (error) throw error
      await registrarLog(id, 'resuelto', { estadoAnterior: 'En proceso', estadoNuevo: 'Resuelto', detalle: solucion })
      await cargarDatos()
    } finally {
      submittingRef.current = false
    }
  }

  const cerrarConMotivo = async (id, motivo) => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const { data: current } = await supabase
        .from('bitacora')
        .select('estado')
        .eq('id', id)
        .single()
      const estadoAnterior = current?.estado || null
      const { error } = await supabase
        .from('bitacora')
        .update({
          estado: 'Cerrado',
          fecha_cierre: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
          updated_by: currentUser
        })
        .eq('id', id)
      if (error) throw error
      await registrarLog(id, 'cerrado_directo', { estadoAnterior, estadoNuevo: 'Cerrado', detalle: motivo })
      await cargarDatos()
    } finally {
      submittingRef.current = false
    }
  }

  const reabrirTicket = async (id) => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const { data: current } = await supabase
        .from('bitacora')
        .select('estado')
        .eq('id', id)
        .single()
      const estadoAnterior = current?.estado || null
      const { error } = await supabase
        .from('bitacora')
        .update({
          estado: 'Pendiente',
          fecha_cierre: null,
          updated_at: new Date().toISOString(),
          updated_by: currentUser
        })
        .eq('id', id)
      if (error) throw error
      await registrarLog(id, 'reabierto', { estadoAnterior, estadoNuevo: 'Pendiente' })
      await cargarDatos()
    } finally {
      submittingRef.current = false
    }
  }

  const completarActividad = async (id) => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const { data: current } = await supabase
        .from('bitacora')
        .select('estado')
        .eq('id', id)
        .single()
      const estadoAnterior = current?.estado || null
      const { error } = await supabase
        .from('bitacora')
        .update({
          estado: 'Completado',
          fecha_cierre: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
          updated_by: currentUser
        })
        .eq('id', id)
      if (error) throw error
      await registrarLog(id, 'completado', { estadoAnterior, estadoNuevo: 'Completado' })
      await cargarDatos()
    } finally {
      submittingRef.current = false
    }
  }

  const filteredAtenciones = atenciones.filter(a => {
    if (filtroEstado && a.estado !== filtroEstado) return false
    if (filtroTipo && a.tipo_actividad !== filtroTipo) return false
    if (filtroPrioridad && a.prioridad !== filtroPrioridad) return false
    if (filtroFechaInicio && a.fecha_atencion < filtroFechaInicio) return false
    if (filtroFechaFin && a.fecha_atencion > filtroFechaFin) return false
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      const persona = a.persona
      const nombreCompleto = persona
        ? `${persona.nombres} ${persona.apellidos}`.toLowerCase()
        : ''
      return (
        nombreCompleto.includes(s) ||
        a.tipo_problema?.toLowerCase().includes(s) ||
        a.descripcion?.toLowerCase().includes(s) ||
        a.solucion?.toLowerCase().includes(s) ||
        a.tipo_actividad?.toLowerCase().includes(s) ||
        a.ambiente?.nombre?.toLowerCase().includes(s) ||
        a.numero_ticket?.toLowerCase().includes(s)
      )
    }
    return true
  })

  const totalPages = Math.ceil(filteredAtenciones.length / PAGE_SIZE) || 1
  const paginatedData = filteredAtenciones.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const stats = {
    total: atenciones.length,
    pendientes: atenciones.filter(a => a.estado === 'Pendiente').length,
    enProceso: atenciones.filter(a => a.estado === 'En proceso').length,
    resueltos: atenciones.filter(a => a.estado === 'Resuelto').length,
    completados: atenciones.filter(a => a.estado === 'Completado').length,
    cerrados: atenciones.filter(a => a.estado === 'Cerrado').length,
    alta: atenciones.filter(a => a.prioridad === 'Alta' && a.estado !== 'Cerrado').length,
    hoy: atenciones.filter(a => a.fecha_atencion === new Date().toISOString().split('T')[0]).length
  }

  const agrupadoPorEstado = (items) => ({
    Pendiente: items.filter(a => a.estado === 'Pendiente'),
    'En proceso': items.filter(a => a.estado === 'En proceso'),
    Resuelto: items.filter(a => a.estado === 'Resuelto'),
    Completado: items.filter(a => a.estado === 'Completado'),
    Cerrado: items.filter(a => a.estado === 'Cerrado')
  })

  const resetFiltros = () => {
    setFiltroEstado(null)
    setFiltroPrioridad(null)
    setFiltroTipo(null)
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setSearchTerm('')
    setCurrentPage(1)
  }

  return {
    atenciones: filteredAtenciones,
    paginatedData,
    totalPages,
    currentPage, setCurrentPage,
    atencionesCrudas: atenciones,
    personas,
    ambientes,
    loading,
    searchTerm, setSearchTerm,
    filtroEstado, setFiltroEstado,
    filtroPrioridad, setFiltroPrioridad,
    filtroFechaInicio, setFiltroFechaInicio,
    filtroFechaFin, setFiltroFechaFin,
    filtroTipo, setFiltroTipo,
    openDrawer, setOpenDrawer,
    editMode, selectedAtencion,
    formData, setFormData,
    currentUser,
    stats,
    agrupadoPorEstado,
    abrirDrawer,
    handleInputChange,
    handleSubmit,
    handleDelete,
    cambiarEstado,
    resolverAtencion,
    cerrarConMotivo,
    reabrirTicket,
    completarActividad,
    cargarDatos,
    resetFiltros,
    emptyForm,
    tick,
    cargarLogs,
    diffHumano
  }
}

export default useBitacora
