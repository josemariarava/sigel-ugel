import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'

const useBitacora = () => {
  const [atenciones, setAtenciones] = useState([])
  const [personas, setPersonas] = useState([])
  const [ambientes, setAmbientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState(null)
  const [filtroPrioridad, setFiltroPrioridad] = useState(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedAtencion, setSelectedAtencion] = useState(null)
  const [currentUser, setCurrentUser] = useState('')

  const emptyForm = {
    persona_id: '',
    ambiente_id: '',
    tipo_problema: '',
    tipo_atencion: 'Presencial',
    descripcion: '',
    solucion: '',
    prioridad: 'Media',
    estado: 'Pendiente',
    fecha_atencion: new Date().toISOString().split('T')[0],
    fecha_cierre: '',
    requiere_seguimiento: false
  }

  const [formData, setFormData] = useState({ ...emptyForm })

  useEffect(() => {
    const user = supabase.auth.getSession()
    user.then(({ data }) => {
      if (data?.session?.user) {
        const meta = data.session.user.user_metadata
        setCurrentUser(meta?.nombre || data.session.user.email || '')
      }
    })
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

  const abrirDrawer = (atencion = null) => {
    setEditMode(!!atencion)
    setSelectedAtencion(atencion)
    if (atencion) {
      setFormData({
        persona_id: atencion.persona_id || '',
        ambiente_id: atencion.ambiente_id || '',
        tipo_problema: atencion.tipo_problema || '',
        tipo_atencion: atencion.tipo_atencion || 'Presencial',
        descripcion: atencion.descripcion || '',
        solucion: atencion.solucion || '',
        prioridad: atencion.prioridad || 'Media',
        estado: atencion.estado || 'Pendiente',
        fecha_atencion: atencion.fecha_atencion || new Date().toISOString().split('T')[0],
        fecha_cierre: atencion.fecha_cierre || '',
        requiere_seguimiento: atencion.requiere_seguimiento || false
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
    if (!formData.persona_id) {
      throw new Error('La persona es obligatoria')
    }
    if (!formData.tipo_problema) {
      throw new Error('El tipo de problema es obligatorio')
    }
    if (!formData.ambiente_id) {
      throw new Error('El ambiente es obligatorio')
    }
    if (!formData.descripcion?.trim()) {
      throw new Error('La descripción del problema es obligatoria')
    }

    const payload = {
      persona_id: formData.persona_id,
      ambiente_id: formData.ambiente_id,
      tipo_problema: formData.tipo_problema,
      tipo_atencion: formData.tipo_atencion,
      descripcion: formData.descripcion,
      solucion: formData.solucion || null,
      prioridad: formData.prioridad,
      estado: formData.estado,
      fecha_atencion: formData.fecha_atencion,
      fecha_cierre: formData.fecha_cierre || null,
      requiere_seguimiento: formData.requiere_seguimiento,
      atendido_por: currentUser
    }

    try {
      if (editMode) {
        const { error } = await supabase
          .from('bitacora')
          .update(payload)
          .eq('id', selectedAtencion.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('bitacora')
          .insert([payload])
        if (error) throw error
      }
      setOpenDrawer(false)
      await cargarDatos()
    } catch (error) {
      throw error
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('bitacora').delete().eq('id', id)
      if (error) throw error
      await cargarDatos()
    } catch (error) {
      throw error
    }
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    const payload = { estado: nuevoEstado }
    if (nuevoEstado === 'Cerrado' || nuevoEstado === 'Resuelto') {
      payload.fecha_cierre = new Date().toISOString().split('T')[0]
    }
    try {
      const { error } = await supabase.from('bitacora').update(payload).eq('id', id)
      if (error) throw error
      await cargarDatos()
    } catch (error) {
      console.error('Error al cambiar estado:', handleApiError(error, 'actualizar estado'))
    }
  }

  const resolverAtencion = async (id, solucion) => {
    try {
      const { error } = await supabase
        .from('bitacora')
        .update({
          estado: 'Resuelto',
          solucion: solucion || null,
          fecha_cierre: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
      if (error) throw error
      await cargarDatos()
    } catch (error) {
      throw error
    }
  }

  const filteredAtenciones = atenciones.filter(a => {
    if (filtroEstado && a.estado !== filtroEstado) return false
    if (filtroPrioridad && a.prioridad !== filtroPrioridad) return false
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
        a.ambiente?.nombre?.toLowerCase().includes(s)
      )
    }
    return true
  })

  const stats = {
    total: atenciones.length,
    pendientes: atenciones.filter(a => a.estado === 'Pendiente').length,
    enProceso: atenciones.filter(a => a.estado === 'En proceso').length,
    resueltos: atenciones.filter(a => a.estado === 'Resuelto').length,
    cerrados: atenciones.filter(a => a.estado === 'Cerrado').length,
    alta: atenciones.filter(a => a.prioridad === 'Alta' && a.estado !== 'Cerrado').length,
    hoy: atenciones.filter(a => a.fecha_atencion === new Date().toISOString().split('T')[0]).length
  }

  const agrupadoPorEstado = (items) => ({
    Pendiente: items.filter(a => a.estado === 'Pendiente'),
    'En proceso': items.filter(a => a.estado === 'En proceso'),
    Resuelto: items.filter(a => a.estado === 'Resuelto'),
    Cerrado: items.filter(a => a.estado === 'Cerrado')
  })

  const resetFiltros = () => {
    setFiltroEstado(null)
    setFiltroPrioridad(null)
    setSearchTerm('')
  }

  return {
    atenciones: filteredAtenciones,
    atencionesCrudas: atenciones,
    personas,
    ambientes,
    loading,
    searchTerm, setSearchTerm,
    filtroEstado, setFiltroEstado,
    filtroPrioridad, setFiltroPrioridad,
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
    cargarDatos,
    resetFiltros,
    emptyForm
  }
}

export default useBitacora
