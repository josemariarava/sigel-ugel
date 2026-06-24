import { useState } from 'react'
import {
  Button,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  Badge,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions
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
  ClockRegular
} from '@fluentui/react-icons'
import useBitacora from '../hooks/useBitacora'
import DrawerBitacora from '../components/bitacora/DrawerBitacora'
import ConfirmDialog from '../components/shared/ConfirmDialog'

const ESTADO_ICON = {
  Pendiente: HistoryRegular,
  'En proceso': WrenchRegular,
  Resuelto: CheckmarkCircleRegular,
  Cerrado: LockClosedRegular
}
const ESTADO_COLOR = {
  Pendiente: { badge: 'severe', bg: 'bg-amber-50 border-amber-200' },
  'En proceso': { badge: 'brand', bg: 'bg-blue-50 border-blue-200' },
  Resuelto: { badge: 'success', bg: 'bg-green-50 border-green-200' },
  Cerrado: { badge: 'neutral', bg: 'bg-gray-50 border-gray-200' }
}
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
    openDrawer, setOpenDrawer,
    editMode, formData,
    stats,
    agrupadoPorEstado,
    abrirDrawer,
    handleInputChange,
    handleSubmit,
    handleDelete,
    cambiarEstado,
    resolverAtencion,
    cargarDatos,
    resetFiltros
  } = useBitacora()

  const { dispatchToast } = useToastController()
  const [vista, setVista] = useState('kanban')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [resolverTarget, setResolverTarget] = useState(null)
  const [resolverSolucion, setResolverSolucion] = useState('')

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

  const grupos = agrupadoPorEstado(atenciones)
  const ordenEstados = ['Pendiente', 'En proceso', 'Resuelto', 'Cerrado']

  return (
    <div className="p-1">
      <Toaster />

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
          <Button appearance="primary" icon={<AddRegular />} onClick={() => abrirDrawer()}>
            Nueva Atención
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><ClipboardRegular /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-xs text-gray-500">Total atenciones</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><HistoryRegular /></div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{stats.pendientes}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><WrenchRegular /></div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{stats.enProceso}</p>
            <p className="text-xs text-gray-500">En proceso</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><CheckmarkCircleRegular /></div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.hoy}</p>
            <p className="text-xs text-gray-500">Atendidos hoy</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600"><ClockRegular /></div>
          <div>
            <p className="text-2xl font-bold text-red-600">{stats.alta}</p>
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
              <button
                key={est}
                onClick={() => setFiltroEstado(filtroEstado === est ? null : est)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all inline-flex items-center gap-1 ${
                  filtroEstado === est
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                <EstadoIcon estado={est} /> {est}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200"></div>

          {/* Prioridad chips */}
          <div className="flex gap-1 flex-wrap">
            {['Alta', 'Media', 'Baja'].map(pri => (
              <button
                key={pri}
                onClick={() => setFiltroPrioridad(filtroPrioridad === pri ? null : pri)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  filtroPrioridad === pri
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {PRIORIDAD_COLOR[pri].label}
              </button>
            ))}
          </div>

          <div className="flex-1 relative max-w-xs ml-auto">
            <SearchRegular className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ fontSize: '14px' }} />
            <input
              type="text"
              placeholder="Buscar persona, problema, ambiente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg"
            />
          </div>

          {(filtroEstado || filtroPrioridad || searchTerm) && (
            <button
              onClick={resetFiltros}
              className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <DismissRegular style={{ fontSize: '12px' }} /> Limpiar
            </button>
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
                    <div key={a.id} className={`bg-white rounded-lg border ${ESTADO_COLOR[estado].bg} p-3 shadow-sm hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-xs text-gray-800 truncate max-w-[140px]">{nombre}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${priColor.bg}`}>
                          {priColor.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{a.tipo_problema}</span>
                        {a.requiere_seguimiento && <span className="text-[10px]"><ArrowSyncRegular style={{ fontSize: 11 }} /></span>}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mb-1">{a.descripcion || '—'}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>{a.fecha_atencion}</span>
                        {a.ambiente && <span className="truncate max-w-[80px]">{a.ambiente.nombre}</span>}
                      </div>
                      <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
                        {estado === 'Pendiente' && (
                          <button
                            onClick={() => onCambiarEstado(a.id, 'En proceso')}
                            className="flex-1 text-[10px] py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                          >
                            Iniciar
                          </button>
                        )}
                        {estado === 'En proceso' && (
                          <button
                            onClick={() => abrirResolver(a)}
                            className="flex-1 text-[10px] py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                          >
                            Resolver
                          </button>
                        )}
                        {estado !== 'Cerrado' && (
                          <button
                            onClick={() => onCambiarEstado(a.id, 'Cerrado')}
                            className="text-[10px] py-1 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors inline-flex items-center"
                            title="Cerrar"
                          >
                            <LockClosedRegular style={{ fontSize: 11 }} />
                          </button>
                        )}
                        <button
                          onClick={() => abrirDrawer(a)}
                          className="text-[10px] py-1 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors inline-flex items-center"
                          title="Editar"
                        >
                          <EditRegular style={{ fontSize: 11 }} />
                        </button>
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
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs">Persona</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs">Problema</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs">Ubicación</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs">Prioridad</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 text-xs">Fecha</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {atenciones.map(a => {
                  const p = a.persona
                  const nombre = p ? `${p.nombres} ${p.apellidos}` : '—'
                  const ec = ESTADO_COLOR[a.estado]
                  const pc = PRIORIDAD_COLOR[a.prioridad]
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800 text-sm">{nombre}</span>
                        {p?.area && <span className="text-xs text-gray-400 ml-1">({p.area.nombre})</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{a.tipo_problema}</span>
                        {a.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{a.descripcion}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {a.ambiente ? (
                          <div>
                            <span>{a.ambiente.nombre}</span>
                            {a.ambiente.piso && <span className="text-gray-400"> · {a.ambiente.piso.nombre || `Piso ${a.ambiente.piso.numero}`}</span>}
                          </div>
                        ) : <span className="text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge appearance="filled" color={ec.badge} size="small">
                          <EstadoIcon estado={a.estado} /> {a.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pc.bg}`}>{pc.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{a.fecha_atencion}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          <Button appearance="subtle" icon={<EditRegular className="text-blue-600" />} onClick={() => abrirDrawer(a)} size="small" title="Editar" />
                          <Button appearance="subtle" icon={<DeleteRegular className="text-red-600" />} onClick={() => setDeleteTarget(a)} size="small" title="Eliminar" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solución aplicada <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolverSolucion}
                onChange={(e) => setResolverSolucion(e.target.value)}
                rows={4}
                placeholder="Describe qué se hizo para resolver el problema..."
                className="w-full text-sm border rounded-lg px-3 py-2.5 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                autoFocus
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

      {/* CONFIRM DELETE */}
      <ConfirmDialog
        open={!!deleteTarget}
        message={deleteTarget ? `¿Eliminar la atención de "${deleteTarget.persona?.nombres || ''} ${deleteTarget.persona?.apellidos || ''}"?` : ''}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Bitacora
