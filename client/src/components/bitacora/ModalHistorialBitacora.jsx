import { useState, useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Spinner
} from '@fluentui/react-components'
import { DismissRegular, HistoryRegular, ClockRegular } from '@fluentui/react-icons'
import { diffHumano } from '../../hooks/useBitacora'

const TIPO_ICON = {
  creado: '🟢',
  editado: '🟡',
  cambio_estado: '🔵',
  resuelto: '🟣',
  eliminado: '🔴'
}

const TIPO_LABEL = {
  creado: 'Creado',
  editado: 'Editado',
  cambio_estado: 'Cambio de estado',
  resuelto: 'Resuelto',
  eliminado: 'Eliminado'
}

const ModalHistorialBitacora = ({ open, atencion, onClose, cargarLogs, tick }) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && atencion) {
      setLoading(true)
      cargarLogs(atencion.id).then(data => {
        setLogs(data)
        setLoading(false)
      })
    }
  }, [open, atencion])

  const formatFecha = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getTiempoEnEstado = (idx) => {
    const current = new Date(logs[idx].created_at)
    const next = logs[idx + 1] ? new Date(logs[idx + 1].created_at) : new Date(tick)
    return diffHumano(current, next)
  }

  const tiempoTotal = atencion
    ? diffHumano(atencion.created_at, atencion.fecha_cierre ? new Date(atencion.fecha_cierre + 'T23:59:59') : new Date(tick))
    : '—'

  return (
    <Dialog open={open} modalType="modal">
      <DialogSurface style={{ maxWidth: '560px' }}>
        <DialogBody>
          <DialogTitle
            action={<Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} />}
          >
            <HistoryRegular className="inline align-text-bottom mr-1" />
            Historial — {atencion?.numero_ticket || ''}
          </DialogTitle>
          <DialogContent>
            <p className="text-sm text-gray-500 mb-4">
              {atencion?.persona?.nombres} {atencion?.persona?.apellidos}
              {atencion?.tipo_problema && ` — ${atencion.tipo_problema}`}
            </p>

            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner size="small" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm italic">
                Sin historial registrado
              </div>
            ) : (
              <div className="space-y-0">
                {logs.map((log, idx) => (
                  <div key={log.id} className="relative flex gap-3 pb-4">
                    {/* Timeline line */}
                    {idx < logs.length - 1 && (
                      <div className="absolute left-[11px] top-5 bottom-0 w-px bg-gray-200" />
                    )}
                    {/* Dot */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-xs">
                      {TIPO_ICON[log.tipo_cambio] || '⚪'}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">
                          {TIPO_LABEL[log.tipo_cambio] || log.tipo_cambio}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatFecha(log.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500">por {log.usuario}</p>
                      {log.tipo_cambio === 'cambio_estado' && log.estado_anterior && log.estado_nuevo && (
                        <p className="text-xs text-gray-500">
                          {log.estado_anterior} → {log.estado_nuevo}
                        </p>
                      )}
                      {log.detalle && (
                        <p className="text-xs text-gray-400 italic mt-0.5">"{log.detalle}"</p>
                      )}
                      {/* Elapsed time in this state */}
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                        <ClockRegular style={{ fontSize: 10 }} />
                        <span>Tiempo en este estado: {getTiempoEnEstado(idx)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total time */}
                <div className="border-t border-gray-100 pt-3 mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <ClockRegular />
                  <span className="font-medium">Tiempo total:</span>
                  <span>{tiempoTotal}</span>
                </div>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export default ModalHistorialBitacora
