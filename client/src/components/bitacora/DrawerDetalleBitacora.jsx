import {
  Button,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Card,
  Badge
} from '@fluentui/react-components'
import {
  DismissRegular,
  ClockRegular,
  PersonRegular,
  LocationRegular,
  ClipboardRegular,
  WarningRegular,
  CalendarRegular,
  HistoryRegular
} from '@fluentui/react-icons'
import { diffHumano } from '../../hooks/useBitacora'

const ESTADO_ICON = {
  Pendiente: HistoryRegular,
  'En proceso': '🛠️',
  Resuelto: '✅',
  Completado: '✅',
  Cerrado: '🔒'
}

const ESTADO_COLOR = {
  Pendiente: { badge: 'severe', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  'En proceso': { badge: 'brand', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  Resuelto: { badge: 'success', bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  Completado: { badge: 'success', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
  Cerrado: { badge: 'neutral', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700' }
}

const PRIORIDAD_COLOR = {
  Alta: { bg: 'bg-red-50 text-red-700' },
  Media: { bg: 'bg-yellow-50 text-yellow-700' },
  Baja: { bg: 'bg-green-50 text-green-700' }
}

const fmtFecha = (d) => d
  ? new Date(d).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
  : '—'

const TIPO_ACTIVIDAD_META = {
  incidencia: { icon: '🔧', label: 'Incidencia Técnica' },
  publicacion: { icon: '📢', label: 'Publicación Web' },
  correo: { icon: '✉️', label: 'Creación de Correo' },
  contrasena: { icon: '🔐', label: 'Restablecer Contraseña' },
  otra: { icon: '📝', label: 'Otra Actividad' }
}

export default function DrawerDetalleBitacora({ open, onClose, data, tick }) {
  if (!data) return null

  const ec = ESTADO_COLOR[data.estado] || ESTADO_COLOR.Pendiente
  const pc = PRIORIDAD_COLOR[data.prioridad] || PRIORIDAD_COLOR.Media
  const IconEstado = typeof ESTADO_ICON[data.estado] === 'function' ? ESTADO_ICON[data.estado] : null
  const nombre = data.persona ? `${data.persona.nombres} ${data.persona.apellidos}` : '—'

  return (
    <Drawer
      position="end"
      open={open}
      onOpenChange={(_, { open }) => { if (!open) onClose() }}
      style={{ width: '100%', maxWidth: '600px' }}
    >
      <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
        <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} />}>
          <div className="flex items-center gap-2">
            <ClipboardRegular className="text-blue-600" />
            <span className="text-lg font-bold text-slate-800">Detalle del Ticket</span>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className="p-6 space-y-4 overflow-y-auto">
        {/* TICKET + ESTADO */}
        <Card appearance="outline" className="border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded">
                {data.numero_ticket || '—'}
              </span>
              {data.tipo_actividad && (
                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {TIPO_ACTIVIDAD_META[data.tipo_actividad]?.icon} {TIPO_ACTIVIDAD_META[data.tipo_actividad]?.label}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 inline-flex items-center gap-1">
              <ClockRegular style={{ fontSize: 11 }} />
              {diffHumano(data.created_at, data.fecha_cierre ? new Date(data.fecha_cierre + 'T23:59:59') : new Date(tick))}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge appearance="filled" color={ec.badge} size="small">
              {IconEstado && <IconEstado className="inline align-text-bottom" style={{ fontSize: 11 }} />}
              {data.estado}
            </Badge>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${pc.bg}`}>
              {data.prioridad}
            </span>
            {data.requiere_seguimiento && (
              <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Requiere seguimiento
              </span>
            )}
          </div>
        </Card>

        {/* PERSONA + UBICACIÓN */}
        <Card appearance="outline" className="border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <PersonRegular className="inline align-text-bottom mr-1" style={{ fontSize: 12 }} />
                Persona
              </div>
              <p className="font-medium text-gray-800">{nombre}</p>
              {data.persona?.area && (
                <p className="text-xs text-gray-500">{data.persona.area.nombre}</p>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <LocationRegular className="inline align-text-bottom mr-1" style={{ fontSize: 12 }} />
                Ubicación
              </div>
              {data.ambiente ? (
                <>
                  <p className="font-medium text-gray-800">{data.ambiente.nombre}</p>
                  {data.ambiente.piso && (
                    <p className="text-xs text-gray-500">
                      {data.ambiente.piso.nombre || `Piso ${data.ambiente.piso.numero}`}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">No especificada</p>
              )}
            </div>
          </div>
        </Card>

        {/* DETALLES (tipo-específico) */}
        <Card appearance="outline" className="border-gray-200">
          {/* Incidencia */}
          {data.tipo_actividad === 'incidencia' && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <WarningRegular className="inline align-text-bottom mr-1" style={{ fontSize: 12 }} />
                Problema
              </div>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                {data.tipo_problema || '—'}
              </span>
              {data.descripcion && (
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{data.descripcion}</p>
              )}
            </>
          )}

          {/* Publicacion */}
          {data.tipo_actividad === 'publicacion' && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <WarningRegular className="inline align-text-bottom mr-1" style={{ fontSize: 12 }} />
                Detalles de Publicación
              </div>
              <div className="space-y-1 text-sm">
                {data.descripcion && (
                  <div>
                    <span className="text-gray-400 text-xs">Título:</span>{' '}
                    <span className="font-medium">{data.descripcion}</span>
                  </div>
                )}
                {data.url_publicacion && (
                  <div>
                    <span className="text-gray-400 text-xs">URL:</span>{' '}
                    <span className="font-medium text-blue-600 break-all">{data.url_publicacion}</span>
                  </div>
                )}
                {data.seccion_publicacion && (
                  <div>
                    <span className="text-gray-400 text-xs">Sección:</span>{' '}
                    <span className="font-medium">{data.seccion_publicacion}</span>
                  </div>
                )}
                {data.fecha_publicacion && (
                  <div>
                    <span className="text-gray-400 text-xs">Publicación:</span>{' '}
                    <span className="font-medium">{data.fecha_publicacion}</span>
                  </div>
                )}
                {data.fecha_expiracion && (
                  <div>
                    <span className="text-gray-400 text-xs">Expiración:</span>{' '}
                    <span className="font-medium">{data.fecha_expiracion}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Correo */}
          {data.tipo_actividad === 'correo' && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <WarningRegular className="inline align-text-bottom mr-1" style={{ fontSize: 12 }} />
                Detalles de Correo
              </div>
              {data.descripcion && (
                <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{data.descripcion}</p>
              )}
              <div className="space-y-1 text-sm">
                {data.cuenta_creada && (
                  <div>
                    <span className="text-gray-400 text-xs">Cuenta:</span>{' '}
                    <span className="font-medium">{data.cuenta_creada}</span>
                  </div>
                )}
                {data.fecha_activacion && (
                  <div>
                    <span className="text-gray-400 text-xs">Activación:</span>{' '}
                    <span className="font-medium">{data.fecha_activacion}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Contrasena */}
          {data.tipo_actividad === 'contrasena' && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <WarningRegular className="inline align-text-bottom mr-1" style={{ fontSize: 12 }} />
                Detalles de Contraseña
              </div>
              {data.descripcion && (
                <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{data.descripcion}</p>
              )}
              <div className="space-y-1 text-sm">
                {data.usuario_restablecido && (
                  <div>
                    <span className="text-gray-400 text-xs">Usuario:</span>{' '}
                    <span className="font-medium">{data.usuario_restablecido}</span>
                  </div>
                )}
                {data.fecha_restablecimiento && (
                  <div>
                    <span className="text-gray-400 text-xs">Restablecimiento:</span>{' '}
                    <span className="font-medium">{data.fecha_restablecimiento}</span>
                  </div>
                )}
                {data.entregada_por && (
                  <div>
                    <span className="text-gray-400 text-xs">Entregada por:</span>{' '}
                    <span className="font-medium">{data.entregada_por}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Otra */}
          {(!data.tipo_actividad || data.tipo_actividad === 'otra') && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <WarningRegular className="inline align-text-bottom mr-1" style={{ fontSize: 12 }} />
                Descripción
              </div>
              {data.descripcion ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.descripcion}</p>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </>
          )}
        </Card>

        {/* ATENCIÓN + AUDITORÍA */}
        <Card appearance="outline" className="border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <CalendarRegular className="inline align-text-bottom mr-1" style={{ fontSize: 12 }} />
                Control
              </div>
              <div className="space-y-1 text-sm">
                {/* Incidencia */}
                {data.tipo_actividad === 'incidencia' && (
                  <>
                    <div>
                      <span className="text-gray-400 text-xs">Tipo atención:</span>{' '}
                      <span className="font-medium">{data.tipo_atencion || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Fecha atención:</span>{' '}
                      <span className="font-medium">{data.fecha_atencion || '—'}</span>
                    </div>
                    {data.fecha_cierre && (
                      <div>
                        <span className="text-gray-400 text-xs">Cierre:</span>{' '}
                        <span className="font-medium">{data.fecha_cierre}</span>
                      </div>
                    )}
                    {data.solucion && (
                      <div className="pt-2 mt-2 border-t border-gray-100">
                        <span className="text-gray-400 text-xs">Solución:</span>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm mt-0.5">{data.solucion}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Publicacion */}
                {data.tipo_actividad === 'publicacion' && (
                  <>
                    <div>
                      <span className="text-gray-400 text-xs">Fecha publicación:</span>{' '}
                      <span className="font-medium">{data.fecha_publicacion || '—'}</span>
                    </div>
                    {data.fecha_expiracion && (
                      <div>
                        <span className="text-gray-400 text-xs">Expiración:</span>{' '}
                        <span className="font-medium">{data.fecha_expiracion}</span>
                      </div>
                    )}
                    {data.fecha_cierre && (
                      <div>
                        <span className="text-gray-400 text-xs">Archivado:</span>{' '}
                        <span className="font-medium">{data.fecha_cierre}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Correo */}
                {data.tipo_actividad === 'correo' && (
                  <>
                    <div>
                      <span className="text-gray-400 text-xs">Cuenta:</span>{' '}
                      <span className="font-medium">{data.cuenta_creada || '—'}</span>
                    </div>
                    {data.fecha_activacion && (
                      <div>
                        <span className="text-gray-400 text-xs">Activación:</span>{' '}
                        <span className="font-medium">{data.fecha_activacion}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Contrasena */}
                {data.tipo_actividad === 'contrasena' && (
                  <>
                    <div>
                      <span className="text-gray-400 text-xs">Usuario:</span>{' '}
                      <span className="font-medium">{data.usuario_restablecido || '—'}</span>
                    </div>
                    {data.fecha_restablecimiento && (
                      <div>
                        <span className="text-gray-400 text-xs">Restablecimiento:</span>{' '}
                        <span className="font-medium">{data.fecha_restablecimiento}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 text-xs">Entregada por:</span>{' '}
                      <span className="font-medium">{data.entregada_por || '—'}</span>
                    </div>
                  </>
                )}

                {/* Otra / default */}
                {(!data.tipo_actividad || data.tipo_actividad === 'otra') && (
                  <>
                    <div>
                      <span className="text-gray-400 text-xs">Fecha:</span>{' '}
                      <span className="font-medium">{data.fecha_atencion || '—'}</span>
                    </div>
                    {data.fecha_cierre && (
                      <div>
                        <span className="text-gray-400 text-xs">Cierre:</span>{' '}
                        <span className="font-medium">{data.fecha_cierre}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <HistoryRegular className="inline align-text-bottom mr-1" style={{ fontSize: 12 }} />
                Auditoría
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Creado por:</span>{' '}
                  <span className="font-medium">{data.atendido_por || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Fecha:</span>{' '}
                  <span className="font-medium">{fmtFecha(data.created_at)}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Últ. mod:</span>{' '}
                  <span className="font-medium">{data.updated_by || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Fecha:</span>{' '}
                  <span className="font-medium">{fmtFecha(data.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </DrawerBody>

      <DrawerFooter className="border-t py-4 px-6 bg-gray-50 flex justify-end">
        <Button appearance="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </DrawerFooter>
    </Drawer>
  )
}