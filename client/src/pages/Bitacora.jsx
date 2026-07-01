import { useState } from 'react'
import {
  Button,
  Input,
  Textarea,
  Label,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,

  Badge,
  Tooltip,
  Radio,
  RadioGroup,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell
} from '@fluentui/react-components'
import {
  AddRegular,
  SearchRegular,
  ArrowSyncRegular,
  EditRegular,
  DeleteRegular,
  TableRegular,
  BoardRegular,
  FilterRegular,
  DismissRegular,
  HistoryRegular,
  WrenchRegular,
  CheckmarkCircleRegular,
  LockClosedRegular,
  ClipboardRegular,
  ClockRegular,
  ArrowUndoRegular,
  WarningRegular
} from '@fluentui/react-icons'
import useBitacora, { diffHumano } from '../hooks/useBitacora'
import DrawerBitacora from '../components/bitacora/DrawerBitacora'
import ModalHistorialBitacora from '../components/bitacora/ModalHistorialBitacora'
import DrawerDetalleBitacora from '../components/bitacora/DrawerDetalleBitacora'
import ConfirmDialog from '../components/shared/ConfirmDialog'

const ESTADO_ICON = {
  Pendiente: HistoryRegular,
  'En proceso': WrenchRegular,
  Resuelto: CheckmarkCircleRegular,
  Completado: CheckmarkCircleRegular,
  Cerrado: LockClosedRegular
}
const ESTADO_COLOR = {
  Pendiente: { badge: 'severe', bg: 'bg-amber-50 border-amber-200' },
  'En proceso': { badge: 'brand', bg: 'bg-blue-50 border-blue-200' },
  Resuelto: { badge: 'success', bg: 'bg-green-50 border-green-200' },
  Completado: { badge: 'success', bg: 'bg-teal-50 border-teal-200' },
  Cerrado: { badge: 'neutral', bg: 'bg-gray-50 border-gray-200' }
}

const TIPO_ACTIVIDAD_META = {
  incidencia: { icon: '🔧', label: 'Incidencia', color: 'bg-blue-100 text-blue-700' },
  publicacion: { icon: '📢', label: 'Publicación', color: 'bg-purple-100 text-purple-700' },
  correo: { icon: '✉️', label: 'Correo', color: 'bg-green-100 text-green-700' },
  contrasena: { icon: '🔐', label: 'Contraseña', color: 'bg-orange-100 text-orange-700' },
  otra: { icon: '📝', label: 'Otra', color: 'bg-gray-100 text-gray-700' }
}
const MOTIVOS_CIERRE = [
  { value: 'duplicado', label: 'Ticket duplicado' },
  { value: 'usuario_resolvio', label: 'Usuario resolvió directamente' },
  { value: 'reporte_invalido', label: 'Reporte inválido' },
  { value: 'ya_no_requiere', label: 'Ya no requiere el servicio' },
  { value: 'otro', label: 'Otro motivo' }
]

const PRIORIDAD_COLOR = {
  Alta: { dot: 'bg-red-500', bg: 'bg-red-50 text-red-700', label: 'Alta' },
  Media: { dot: 'bg-yellow-500', bg: 'bg-yellow-50 text-yellow-700', label: 'Media' },
  Baja: { dot: 'bg-green-500', bg: 'bg-green-50 text-green-700', label: 'Baja' }
}
const EstadoIcon = ({ estado, className = '' }) => {
  const Icon = ESTADO_ICON[estado]
  return Icon ? <Icon className={`inline align-text-bottom ${className}`} /> : null
}

const Bitacora = () => {
  const {
    atenciones, personas, ambientes, loading,
    searchTerm, setSearchTerm,
    filtroEstado, setFiltroEstado,
    filtroPrioridad, setFiltroPrioridad,
    filtroFechaInicio, setFiltroFechaInicio,
    filtroFechaFin, setFiltroFechaFin,
    filtroTipo, setFiltroTipo,
    openDrawer, setOpenDrawer,
    editMode, formData, selectedAtencion,
    stats,
    agrupadoPorEstado,
    paginatedData, totalPages, currentPage, setCurrentPage,
    tick, cargarLogs,
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
    resetFiltros
  } = useBitacora()

  const { dispatchToast } = useToastController()
  const [vista, setVista] = useState('kanban')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [resolverTarget, setResolverTarget] = useState(null)
  const [resolverSolucion, setResolverSolucion] = useState('')
  const [exportando, setExportando] = useState(false)
  const [historialTarget, setHistorialTarget] = useState(null)
  const [cerrarMotivoTarget, setCerrarMotivoTarget] = useState(null)
  const [cerrarMotivoVal, setCerrarMotivoVal] = useState('')
  const [cerrarMotivoOtro, setCerrarMotivoOtro] = useState('')
  const [reabrirTarget, setReabrirTarget] = useState(null)
  const [detalleTarget, setDetalleTarget] = useState(null)

  const exportarAExcel = async () => {
    try {
      setExportando(true)
      const { utils, writeFile } = await import('xlsx')
      const datosExportar = atenciones.map(a => ({
        'N° Ticket': a.numero_ticket || '',
        'Tipo Actividad': TIPO_ACTIVIDAD_META[a.tipo_actividad]?.label || 'Incidencia Técnica',
        Persona: a.persona ? `${a.persona.nombres} ${a.persona.apellidos}` : '—',
        Problema: a.tipo_problema || '',
        Descripción: a.descripcion || '',
        Solución: a.solucion || '',
        Ambiente: a.ambiente?.nombre || '',
        Estado: a.estado,
        Prioridad: a.prioridad,
        'Fecha atención': a.fecha_atencion,
        'Fecha cierre': a.fecha_cierre || '',
        'Tipo atención': a.tipo_atencion || '',
        Seguimiento: a.requiere_seguimiento ? 'Sí' : 'No',
        'Tiempo total': diffHumano(a.created_at, a.fecha_cierre ? new Date(a.fecha_cierre + 'T23:59:59') : new Date())
      }))
      const ws = utils.json_to_sheet(datosExportar)
      ws['!cols'] = [
        { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 40 },
        { wch: 40 }, { wch: 20 }, { wch: 14 }, { wch: 12 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
        { wch: 14 }
      ]
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Bitácora')
      writeFile(wb, `bitacora_${new Date().toISOString().split('T')[0]}.xlsx`)
      mostrarToast('Exportación completada')
    } catch (error) {
      mostrarToast('Error al exportar: ' + (error.message || ''), 'error')
    } finally {
      setExportando(false)
    }
  }

  const mostrarToast = (mensaje, tipo = 'success') => {
    dispatchToast(
      <Toast>
        <ToastTitle>{tipo === 'success' ? <><CheckmarkCircleRegular className="inline align-text-bottom text-green-500" /> Éxito</> : <><DismissRegular className="inline align-text-bottom text-red-500" /> Error</>}</ToastTitle>
        <ToastBody>{mensaje}</ToastBody>
      </Toast>,
      { intent: tipo }
    )
  }

  const onSubmit = async () => {
    try {
      setSubmitting(true)
      await handleSubmit()
      mostrarToast(editMode ? 'Atención actualizada correctamente' : 'Atención registrada correctamente')
    } catch (error) {
      mostrarToast(error.message || 'Error al guardar', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!deleteTarget) return
    try {
      await handleDelete(deleteTarget.id)
      mostrarToast('Atención eliminada correctamente')
    } catch (error) {
      mostrarToast(error.message || 'Error al eliminar', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const onCambiarEstado = (id, estado) => {
    cambiarEstado(id, estado)
    mostrarToast(`Estado cambiado a ${estado}`)
  }

  const abrirResolver = (atencion) => {
    setResolverTarget(atencion)
    setResolverSolucion(atencion.solucion || '')
  }

  const onResolver = async () => {
    if (!resolverTarget) return
    if (!resolverSolucion.trim()) {
      mostrarToast('Debes describir la solución aplicada', 'error')
      return
    }
    try {
      setSubmitting(true)
      await resolverAtencion(resolverTarget.id, resolverSolucion.trim())
      mostrarToast('Atención resuelta correctamente')
      setResolverTarget(null)
      setResolverSolucion('')
    } catch (error) {
      mostrarToast(error.message || 'Error al resolver', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onCerrarConMotivo = async () => {
    if (!cerrarMotivoTarget) return
    const motivoText = cerrarMotivoVal === 'otro'
      ? `Otro: ${cerrarMotivoOtro.trim()}`
      : MOTIVOS_CIERRE.find(m => m.value === cerrarMotivoVal)?.label || cerrarMotivoVal
    if (!motivoText) {
      mostrarToast('Selecciona o escribe el motivo de cierre', 'error')
      return
    }
    try {
      setSubmitting(true)
      await cerrarConMotivo(cerrarMotivoTarget.id, motivoText)
      mostrarToast('Ticket cerrado correctamente')
      setCerrarMotivoTarget(null)
      setCerrarMotivoVal('')
      setCerrarMotivoOtro('')
    } catch (error) {
      mostrarToast(error.message || 'Error al cerrar ticket', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onReabrir = async () => {
    if (!reabrirTarget) return
    try {
      setSubmitting(true)
      await reabrirTicket(reabrirTarget.id)
      mostrarToast('Ticket reabierto, volvió a Pendiente')
      setReabrirTarget(null)
    } catch (error) {
      mostrarToast(error.message || 'Error al reabrir ticket', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onCompletar = async (atencion) => {
    try {
      setSubmitting(true)
      await completarActividad(atencion.id)
      mostrarToast('Actividad completada correctamente')
    } catch (error) {
      mostrarToast(error.message || 'Error al completar', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const grupos = agrupadoPorEstado(atenciones)
  const ordenEstados = ['Pendiente', 'En proceso', 'Resuelto', 'Completado', 'Cerrado']

  return (
    <div className="p-1">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ClipboardRegular />Centro de Atenciones</h1>
          <p className="text-sm text-gray-500">Registro de soporte técnico y atenciones al personal</p>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Ver como tabla" relationship="label">
            <Button
              appearance={vista === 'tabla' ? 'primary' : 'subtle'}
              icon={<TableRegular />}
              onClick={() => setVista('tabla')}
            />
          </Tooltip>
          <Tooltip content="Ver Kanban" relationship="label">
            <Button
              appearance={vista === 'kanban' ? 'primary' : 'subtle'}
              icon={<BoardRegular />}
              onClick={() => setVista('kanban')}
            />
          </Tooltip>
          <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={cargarDatos}>Actualizar</Button>
          <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={exportarAExcel} disabled={exportando}>{exportando ? 'Exportando...' : 'Excel'}</Button>
          <Button appearance="primary" icon={<AddRegular />} onClick={() => abrirDrawer()}>
            Nueva Atención
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><ClipboardRegular /></div>
          <div>
            {loading ? <div className="h-7 w-12 bg-gray-200 animate-pulse rounded"></div> : <p className="text-2xl font-bold text-gray-800">{stats.total}</p>}
            <p className="text-xs text-gray-500">Total atenciones</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><HistoryRegular /></div>
          <div>
            {loading ? <div className="h-7 w-12 bg-gray-200 animate-pulse rounded"></div> : <p className="text-2xl font-bold text-amber-600">{stats.pendientes}</p>}
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><WrenchRegular /></div>
          <div>
            {loading ? <div className="h-7 w-12 bg-gray-200 animate-pulse rounded"></div> : <p className="text-2xl font-bold text-blue-600">{stats.enProceso}</p>}
            <p className="text-xs text-gray-500">En proceso</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><CheckmarkCircleRegular /></div>
          <div>
            {loading ? <div className="h-7 w-12 bg-gray-200 animate-pulse rounded"></div> : <p className="text-2xl font-bold text-green-600">{stats.hoy}</p>}
            <p className="text-xs text-gray-500">Atendidos hoy</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600"><CheckmarkCircleRegular /></div>
          <div>
            {loading ? <div className="h-7 w-12 bg-gray-200 animate-pulse rounded"></div> : <p className="text-2xl font-bold text-teal-600">{stats.completados}</p>}
            <p className="text-xs text-gray-500">Completados</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600"><ClockRegular /></div>
          <div>
            {loading ? <div className="h-7 w-12 bg-gray-200 animate-pulse rounded"></div> : <p className="text-2xl font-bold text-red-600">{stats.alta}</p>}
            <p className="text-xs text-gray-500">Prioridad alta sin cerrar</p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <FilterRegular style={{ fontSize: '14px' }} />
            <span>Filtros:</span>
          </div>

          {/* Estado chips */}
          <div className="flex gap-1 flex-wrap">
            {['Pendiente', 'En proceso', 'Resuelto', 'Cerrado'].map(est => (
              <Button
                key={est}
                shape="circular"
                size="small"
                appearance={filtroEstado === est ? 'primary' : 'outline'}
                onClick={() => setFiltroEstado(filtroEstado === est ? null : est)}
                className="text-xs"
              >
                <EstadoIcon estado={est} /> {est}
              </Button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200"></div>

          {/* Prioridad chips */}
          <div className="flex gap-1 flex-wrap">
            {['Alta', 'Media', 'Baja'].map(pri => (
              <Button
                key={pri}
                shape="circular"
                size="small"
                appearance={filtroPrioridad === pri ? 'primary' : 'outline'}
                onClick={() => setFiltroPrioridad(filtroPrioridad === pri ? null : pri)}
                className="text-xs"
              >
                {PRIORIDAD_COLOR[pri].label}
              </Button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200"></div>

          {/* Tipo actividad chips */}
          <div className="flex gap-1 flex-wrap">
            {[
              { value: null, label: '📋 Todas' },
              { value: 'incidencia', label: '🔧 Incidencias' },
              { value: 'publicacion', label: '📢 Publicaciones' },
              { value: 'correo', label: '✉️ Correos' },
              { value: 'contrasena', label: '🔐 Contraseñas' },
              { value: 'otra', label: '📝 Otras' },
            ].map(t => (
              <Button
                key={t.value || 'todas'}
                shape="circular"
                size="small"
                appearance={filtroTipo === t.value ? 'primary' : 'outline'}
                onClick={() => setFiltroTipo(t.value)}
                className="text-xs"
              >
                {t.label}
              </Button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200"></div>

          {/* Rango de fechas */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Desde:</span>
            <Input
              type="date"
              size="small"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              className="w-[140px]"
            />
            <span className="text-xs text-gray-500">Hasta:</span>
            <Input
              type="date"
              size="small"
              value={filtroFechaFin}
              onChange={(e) => setFiltroFechaFin(e.target.value)}
              className="w-[140px]"
            />
          </div>

          <div className="flex-1 max-w-xs ml-auto">
            <Input
              type="text"
              placeholder="Buscar persona, problema, ambiente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              contentBefore={<SearchRegular />}
              size="small"
            />
          </div>

          {(filtroEstado || filtroPrioridad || filtroTipo || filtroFechaInicio || filtroFechaFin || searchTerm) && (
            <Button appearance="transparent" size="small" icon={<DismissRegular />} onClick={resetFiltros}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : atenciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="mb-3 text-gray-300"><ClipboardRegular style={{ fontSize: 36 }} /></div>
          <p className="text-gray-400 text-lg">No hay atenciones registradas</p>
          <p className="text-gray-300 text-sm mt-1">Haz clic en "Nueva Atención" para comenzar</p>
        </div>
      ) : vista === 'kanban' ? (
        <div className="grid grid-cols-4 gap-4">
          {ordenEstados.map(estado => (
            <div key={estado} className="bg-gray-50/70 rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-1">
                  <EstadoIcon estado={estado} /> {estado}
                </h3>
                <Badge appearance="filled" color={ESTADO_COLOR[estado].badge} size="small">
                  {grupos[estado].length}
                </Badge>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {grupos[estado].map(a => {
                  const p = a.persona
                  const nombre = p ? `${p.nombres} ${p.apellidos}` : '—'
                  const priColor = PRIORIDAD_COLOR[a.prioridad]
                  return (
                    <div
                      key={a.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Atención ${a.numero_ticket || ''} de ${nombre} - ${a.tipo_problema || ''}`}
                      onClick={() => abrirDrawer(a)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirDrawer(a) } }}
                      className={`bg-white rounded-lg border ${ESTADO_COLOR[estado].bg} p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{a.numero_ticket || '—'}</span>
                        <div className="flex gap-1">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TIPO_ACTIVIDAD_META[a.tipo_actividad]?.color || 'bg-gray-100 text-gray-700'}`}>
                            {TIPO_ACTIVIDAD_META[a.tipo_actividad]?.icon} {TIPO_ACTIVIDAD_META[a.tipo_actividad]?.label}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${priColor.bg}`}>
                            {priColor.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-xs text-gray-800 truncate max-w-[140px]">{nombre}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{a.tipo_problema}</span>
                        {a.requiere_seguimiento && <span className="text-[10px]"><ArrowSyncRegular style={{ fontSize: 11 }} /></span>}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mb-1">{a.descripcion || '—'}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>{a.fecha_atencion}</span>
                        <span className="text-[10px] flex items-center gap-1">
                          <ClockRegular style={{ fontSize: 10 }} />
                          {diffHumano(a.created_at, a.fecha_cierre ? new Date(a.fecha_cierre + 'T23:59:59') : new Date(tick))}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100 flex-wrap">
                        {a.tipo_actividad === 'incidencia' ? (
                          <>
                            {estado === 'Pendiente' && (
                              <>
                                <Button size="small" appearance="primary" onClick={(e) => { e.stopPropagation(); onCambiarEstado(a.id, 'En proceso') }}>Iniciar</Button>
                                <Button size="small" appearance="subtle" icon={<LockClosedRegular />} onClick={(e) => { e.stopPropagation(); setCerrarMotivoTarget(a); setCerrarMotivoVal(''); setCerrarMotivoOtro('') }} title="Cerrar con motivo" />
                              </>
                            )}
                            {estado === 'En proceso' && (
                              <>
                                <Button size="small" appearance="primary" onClick={(e) => { e.stopPropagation(); abrirResolver(a) }}>Resolver</Button>
                                <Button size="small" appearance="subtle" icon={<LockClosedRegular />} onClick={(e) => { e.stopPropagation(); setCerrarMotivoTarget(a); setCerrarMotivoVal(''); setCerrarMotivoOtro('') }} title="Cerrar con motivo" />
                                <Button size="small" appearance="subtle" icon={<ArrowUndoRegular />} onClick={(e) => { e.stopPropagation(); setReabrirTarget(a) }} title="Volver a Pendiente" />
                              </>
                            )}
                            {estado === 'Resuelto' && (
                              <>
                                <Button size="small" appearance="primary" onClick={(e) => { e.stopPropagation(); onCambiarEstado(a.id, 'Cerrado') }}>Cerrar</Button>
                                <Button size="small" appearance="subtle" icon={<ArrowUndoRegular />} onClick={(e) => { e.stopPropagation(); setReabrirTarget(a) }} title="Reabrir" />
                              </>
                            )}
                            {estado === 'Cerrado' && (
                              <Button size="small" appearance="subtle" icon={<ArrowUndoRegular />} onClick={(e) => { e.stopPropagation(); setReabrirTarget(a) }} title="Reabrir">Reabrir</Button>
                            )}
                          </>
                        ) : (
                          <>
                            {estado === 'Pendiente' && (
                              <>
                                <Button size="small" appearance="primary" onClick={(e) => { e.stopPropagation(); onCambiarEstado(a.id, 'En proceso') }}>Iniciar</Button>
                                <Button size="small" appearance="primary" onClick={(e) => { e.stopPropagation(); onCompletar(a) }}>Completar</Button>
                              </>
                            )}
                            {estado === 'En proceso' && (
                              <>
                                <Button size="small" appearance="primary" onClick={(e) => { e.stopPropagation(); onCompletar(a) }}>Completar</Button>
                                <Button size="small" appearance="subtle" icon={<ArrowUndoRegular />} onClick={(e) => { e.stopPropagation(); setReabrirTarget(a) }} title="Volver a Pendiente" />
                              </>
                            )}
                            {estado === 'Resuelto' && (
                              <>
                                <Button size="small" appearance="primary" onClick={(e) => { e.stopPropagation(); onCambiarEstado(a.id, 'Cerrado') }}>Cerrar</Button>
                                <Button size="small" appearance="subtle" icon={<ArrowUndoRegular />} onClick={(e) => { e.stopPropagation(); setReabrirTarget(a) }} title="Reabrir" />
                              </>
                            )}
                            {estado === 'Completado' && (
                              <Button size="small" appearance="subtle" icon={<ArrowUndoRegular />} onClick={(e) => { e.stopPropagation(); setReabrirTarget(a) }} title="Reabrir">Reabrir</Button>
                            )}
                            {estado === 'Cerrado' && (
                              <Button size="small" appearance="subtle" icon={<ArrowUndoRegular />} onClick={(e) => { e.stopPropagation(); setReabrirTarget(a) }} title="Reabrir">Reabrir</Button>
                            )}
                          </>
                        )}
                        <Button size="small" appearance="subtle" icon={<ClipboardRegular />} onClick={(e) => { e.stopPropagation(); setDetalleTarget(a) }} title="Ver detalles" />
                        <Button size="small" appearance="subtle" icon={<HistoryRegular />} onClick={(e) => { e.stopPropagation(); setHistorialTarget(a) }} title="Ver historial" />
                        <Button size="small" appearance="subtle" icon={<EditRegular />} onClick={(e) => { e.stopPropagation(); abrirDrawer(a) }} title="Editar" />
                      </div>
                    </div>
                  )
                })}
                {grupos[estado].length === 0 && (
                  <div className="text-center py-6 text-gray-300 text-xs italic">Sin atenciones</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VISTA TABLA */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Ticket</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Persona</TableHeaderCell>
                  <TableHeaderCell>Problema</TableHeaderCell>
                  <TableHeaderCell>Ubicación</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Prioridad</TableHeaderCell>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Tiempo</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(a => {
                  const p = a.persona
                  const nombre = p ? `${p.nombres} ${p.apellidos}` : '—'
                  const ec = ESTADO_COLOR[a.estado]
                  const pc = PRIORIDAD_COLOR[a.prioridad]
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <span className="text-xs font-mono text-gray-500">{a.numero_ticket || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_ACTIVIDAD_META[a.tipo_actividad]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {TIPO_ACTIVIDAD_META[a.tipo_actividad]?.icon} {TIPO_ACTIVIDAD_META[a.tipo_actividad]?.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-800 text-sm">{nombre}</span>
                        {p?.area && <span className="text-xs text-gray-400 ml-1">({p.area.nombre})</span>}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{a.tipo_problema}</span>
                        {a.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{a.descripcion}</p>}
                      </TableCell>
                      <TableCell>
                        {a.ambiente ? (
                          <div className="text-xs text-gray-600">
                            <span>{a.ambiente.nombre}</span>
                            {a.ambiente.piso && <span className="text-gray-400"> · {a.ambiente.piso.nombre || `Piso ${a.ambiente.piso.numero}`}</span>}
                          </div>
                        ) : <span className="text-gray-300 italic text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge appearance="filled" color={ec.badge} size="small">
                          <EstadoIcon estado={a.estado} /> {a.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pc.bg}`}>{pc.label}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">{a.fecha_atencion}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                          <ClockRegular style={{ fontSize: 11 }} />
                          {diffHumano(a.created_at, a.fecha_cierre ? new Date(a.fecha_cierre + 'T23:59:59') : new Date(tick))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center flex-wrap">
                          {a.tipo_actividad === 'incidencia' ? (
                            <>
                              {a.estado === 'Pendiente' && (
                                <>
                                  <Button appearance="subtle" icon={<WrenchRegular />} onClick={() => onCambiarEstado(a.id, 'En proceso')} size="small" title="Iniciar" />
                                  <Button appearance="subtle" icon={<LockClosedRegular />} onClick={() => { setCerrarMotivoTarget(a); setCerrarMotivoVal(''); setCerrarMotivoOtro('') }} size="small" title="Cerrar con motivo" />
                                </>
                              )}
                              {a.estado === 'En proceso' && (
                                <>
                                  <Button appearance="subtle" icon={<CheckmarkCircleRegular />} onClick={() => abrirResolver(a)} size="small" title="Resolver" />
                                  <Button appearance="subtle" icon={<LockClosedRegular />} onClick={() => { setCerrarMotivoTarget(a); setCerrarMotivoVal(''); setCerrarMotivoOtro('') }} size="small" title="Cerrar con motivo" />
                                  <Button appearance="subtle" icon={<ArrowUndoRegular />} onClick={() => setReabrirTarget(a)} size="small" title="Volver a Pendiente" />
                                </>
                              )}
                              {a.estado === 'Resuelto' && (
                                <>
                                  <Button appearance="subtle" icon={<LockClosedRegular />} onClick={() => onCambiarEstado(a.id, 'Cerrado')} size="small" title="Cerrar" />
                                  <Button appearance="subtle" icon={<ArrowUndoRegular />} onClick={() => setReabrirTarget(a)} size="small" title="Reabrir" />
                                </>
                              )}
                              {a.estado === 'Cerrado' && (
                                <Button appearance="subtle" icon={<ArrowUndoRegular />} onClick={() => setReabrirTarget(a)} size="small" title="Reabrir" />
                              )}
                            </>
                          ) : (
                            <>
                              {a.estado === 'Pendiente' && (
                                <>
                                  <Button appearance="subtle" icon={<WrenchRegular />} onClick={() => onCambiarEstado(a.id, 'En proceso')} size="small" title="Iniciar" />
                                  <Button appearance="subtle" icon={<CheckmarkCircleRegular />} onClick={() => onCompletar(a)} size="small" title="Completar" />
                                </>
                              )}
                              {a.estado === 'En proceso' && (
                                <>
                                  <Button appearance="subtle" icon={<CheckmarkCircleRegular />} onClick={() => onCompletar(a)} size="small" title="Completar" />
                                  <Button appearance="subtle" icon={<ArrowUndoRegular />} onClick={() => setReabrirTarget(a)} size="small" title="Volver a Pendiente" />
                                </>
                              )}
                              {a.estado === 'Resuelto' && (
                                <>
                                  <Button appearance="subtle" icon={<LockClosedRegular />} onClick={() => onCambiarEstado(a.id, 'Cerrado')} size="small" title="Cerrar" />
                                  <Button appearance="subtle" icon={<ArrowUndoRegular />} onClick={() => setReabrirTarget(a)} size="small" title="Reabrir" />
                                </>
                              )}
                              {(a.estado === 'Completado' || a.estado === 'Cerrado') && (
                                <Button appearance="subtle" icon={<ArrowUndoRegular />} onClick={() => setReabrirTarget(a)} size="small" title="Reabrir" />
                              )}
                            </>
                          )}
                          <Button appearance="subtle" icon={<ClipboardRegular />} onClick={() => setDetalleTarget(a)} size="small" title="Detalles" />
                          <Button appearance="subtle" icon={<HistoryRegular />} onClick={() => setHistorialTarget(a)} size="small" title="Historial" />
                          <Button appearance="subtle" icon={<EditRegular />} onClick={() => abrirDrawer(a)} size="small" title="Editar" />
                          <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => setDeleteTarget(a)} size="small" title="Eliminar" />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-xs text-gray-500">
                Página {currentPage} de {totalPages} ({atenciones.length} registros)
              </span>
              <div className="flex gap-1">
                <Button size="small" appearance="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <Button size="small" appearance="outline" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DRAWER */}
      <DrawerBitacora
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        editMode={editMode}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={onSubmit}
        personas={personas}
        ambientes={ambientes}
        submitting={submitting}
        numeroTicket={selectedAtencion?.numero_ticket || ''}
        createdAt={selectedAtencion?.created_at || ''}
      />

      {/* DRAWER DETALLES */}
      <DrawerDetalleBitacora
        open={!!detalleTarget}
        data={detalleTarget}
        onClose={() => setDetalleTarget(null)}
        tick={tick}
      />

      {/* MODAL RESOLVER */}
      <Dialog open={!!resolverTarget} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle><CheckmarkCircleRegular className="inline align-text-bottom text-green-600" /> Marcar como Resuelto</DialogTitle>
            <DialogContent>
              <p className="text-sm text-gray-500 mb-3">
                Atención a {resolverTarget?.persona?.nombres} {resolverTarget?.persona?.apellidos}
                {resolverTarget?.ambiente && ` — ${resolverTarget.ambiente.nombre}`}
              </p>
              <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1 mb-3">
                <p><span className="font-medium">Problema:</span> {resolverTarget?.tipo_problema}</p>
                {resolverTarget?.descripcion && <p className="text-gray-600">{resolverTarget.descripcion}</p>}
              </div>
              <Label required>Solución aplicada</Label>
              <Textarea
                value={resolverSolucion}
                onChange={(e) => setResolverSolucion(e.target.value)}
                rows={4}
                placeholder="Describe qué se hizo para resolver el problema..."
                autoFocus
                className="mt-1"
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => { setResolverTarget(null); setResolverSolucion('') }} disabled={submitting}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={onResolver} disabled={submitting || !resolverSolucion.trim()}>
                {submitting ? 'Guardando...' : 'Confirmar Resolución'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* MODAL HISTORIAL */}
      <ModalHistorialBitacora
        open={!!historialTarget}
        atencion={historialTarget}
        onClose={() => setHistorialTarget(null)}
        cargarLogs={cargarLogs}
        tick={tick}
      />

      {/* CONFIRM DELETE */}
      <ConfirmDialog
        open={!!deleteTarget}
        message={deleteTarget ? `¿Eliminar la atención de "${deleteTarget.persona?.nombres || ''} ${deleteTarget.persona?.apellidos || ''}"?` : ''}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* CERRAR CON MOTIVO */}
      <Dialog open={!!cerrarMotivoTarget} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle><WarningRegular className="inline align-text-bottom text-amber-600" /> Cerrar ticket sin resolver</DialogTitle>
            <DialogContent>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm mb-4">
                <p><span className="font-medium">Ticket:</span> {cerrarMotivoTarget?.numero_ticket || '—'}</p>
                <p><span className="font-medium">Estado actual:</span> {cerrarMotivoTarget?.estado}</p>
                <p className="text-amber-700 mt-1">Este ticket se cerrará sin pasar por el estado "Resuelto".</p>
              </div>
              <Label required>Motivo de cierre</Label>
              <RadioGroup
                value={cerrarMotivoVal}
                onChange={(_, data) => setCerrarMotivoVal(data.value)}
                className="mt-2"
              >
                {MOTIVOS_CIERRE.map(m => (
                  <Radio key={m.value} value={m.value} label={m.label} />
                ))}
              </RadioGroup>
              {cerrarMotivoVal === 'otro' && (
                <Input
                  placeholder="Describe el motivo..."
                  value={cerrarMotivoOtro}
                  onChange={(e) => setCerrarMotivoOtro(e.target.value)}
                  className="mt-2"
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => { setCerrarMotivoTarget(null); setCerrarMotivoVal(''); setCerrarMotivoOtro('') }} disabled={submitting}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={onCerrarConMotivo} disabled={submitting || !cerrarMotivoVal || (cerrarMotivoVal === 'otro' && !cerrarMotivoOtro.trim())}>
                {submitting ? 'Cerrando...' : 'Cerrar ticket'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* CONFIRMAR REAPERTURA */}
      <Dialog open={!!reabrirTarget} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle><ArrowUndoRegular className="inline align-text-bottom text-blue-600" /> Reabrir ticket</DialogTitle>
            <DialogContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm mb-2">
                <p><span className="font-medium">Ticket:</span> {reabrirTarget?.numero_ticket || '—'}</p>
                <p><span className="font-medium">Estado actual:</span> {reabrirTarget?.estado}</p>
              </div>
              <p className="text-sm text-gray-600 mt-2">El ticket volverá a estado <strong>Pendiente</strong> para ser atendido nuevamente.</p>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setReabrirTarget(null)} disabled={submitting}>
                Cancelar
              </Button>
              <Button appearance="primary" icon={<ArrowUndoRegular />} onClick={onReabrir} disabled={submitting}>
                {submitting ? 'Reabriendo...' : 'Reabrir'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}

export default Bitacora
