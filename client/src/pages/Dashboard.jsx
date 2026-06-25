import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  Card,
  Badge,
  Spinner
} from '@fluentui/react-components'
import {
  DesktopRegular,
  PeopleRegular,
  ClipboardTaskRegular,
  MoneyRegular,
  DocumentRegular,
  ClockRegular
} from '@fluentui/react-icons'

const ESTADO_BADGE = {
  Pendiente: 'severe',
  'En proceso': 'brand',
  Resuelto: 'success',
  Cerrado: 'neutral'
}

const ESTADO_BIEN_BADGE = {
  Activo: 'success',
  Asignado: 'brand',
  Inactivo: 'severe',
  Mantenimiento: 'warning',
  'Dado de baja': 'danger',
  Disponible: 'success'
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBienes: 0, totalPersonas: 0, asignacionesActivas: 0,
    bitacoraPendientes: 0, atendidosHoy: 0, valorTotal: 0
  })
  const [recientes, setRecientes] = useState([])
  const [bienesPorEstado, setBienesPorEstado] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0]

      const [
        bienesCnt, personasCnt, asignacionesCnt,
        bitacoraPendientesCnt, bitacoraHoyCnt, valorRes,
        recientesRes, bienesEstadoRes
      ] = await Promise.all([
        supabase.from('bienes').select('*', { count: 'exact', head: true }),
        supabase.from('personas').select('*', { count: 'exact', head: true }),
        supabase.from('asignaciones').select('*', { count: 'exact', head: true }).eq('estado_asignacion', 'Activo'),
        supabase.from('bitacora').select('*', { count: 'exact', head: true }).in('estado', ['Pendiente', 'En proceso']),
        supabase.from('bitacora').select('*', { count: 'exact', head: true }).gte('created_at', hoy),
        supabase.from('bienes').select('valor_compra'),
        supabase.from('bitacora').select('*, persona:personas(nombres, apellidos)').order('created_at', { ascending: false }).limit(5),
        supabase.from('bienes').select('estado')
      ])

      const sumaValor = valorRes.data?.reduce((s, i) => s + (i.valor_compra || 0), 0) || 0
      setStats({
        totalBienes: bienesCnt.count || 0,
        totalPersonas: personasCnt.count || 0,
        asignacionesActivas: asignacionesCnt.count || 0,
        bitacoraPendientes: bitacoraPendientesCnt.count || 0,
        atendidosHoy: bitacoraHoyCnt.count || 0,
        valorTotal: sumaValor
      })

      setRecientes(recientesRes.data || [])

      const estadoMap = {}
      ;(bienesEstadoRes.data || []).forEach(b => {
        estadoMap[b.estado] = (estadoMap[b.estado] || 0) + 1
      })
      setBienesPorEstado(Object.entries(estadoMap).sort((a, b) => b[1] - a[1]))
    } catch (error) {
      console.error('[Dashboard] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="large" />
      </div>
    )
  }

  const tarjetas = [
    { titulo: 'Bienes Registrados', valor: stats.totalBienes, icono: DesktopRegular, gradiente: 'from-blue-600 to-blue-700', bgIcon: 'bg-blue-500/20' },
    { titulo: 'Personas', valor: stats.totalPersonas, icono: PeopleRegular, gradiente: 'from-green-600 to-green-700', bgIcon: 'bg-green-500/20' },
    { titulo: 'Asignaciones Activas', valor: stats.asignacionesActivas, icono: ClipboardTaskRegular, gradiente: 'from-purple-600 to-purple-700', bgIcon: 'bg-purple-500/20' },
    { titulo: 'Pendientes', valor: stats.bitacoraPendientes, icono: ClockRegular, gradiente: 'from-amber-600 to-amber-700', bgIcon: 'bg-amber-500/20' },
    { titulo: 'Atendidos Hoy', valor: stats.atendidosHoy, icono: DocumentRegular, gradiente: 'from-teal-600 to-teal-700', bgIcon: 'bg-teal-500/20' },
    { titulo: 'Valor Total', valor: `S/ ${stats.valorTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, icono: MoneyRegular, gradiente: 'from-rose-600 to-rose-700', bgIcon: 'bg-rose-500/20' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Resumen general del sistema SIGEL</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {tarjetas.map((t, i) => {
          const Icon = t.icono
          return (
            <Card key={i} className="!p-4 !shadow-sm hover:!shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${t.bgIcon} flex items-center justify-center`}>
                  <Icon className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{t.titulo}</p>
                  <p className="text-lg font-bold text-gray-800 mt-0.5 truncate">{t.valor}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas atenciones */}
        <Card className="!p-0 !shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Últimas Atenciones</h2>
          </div>
          <div className="p-5">
            {recientes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin atenciones registradas</p>
            ) : (
              <div className="space-y-3">
                {recientes.map(a => {
                  const p = a.persona
                  const nombre = p ? `${p.nombres} ${p.apellidos}` : '—'
                  return (
                    <div key={a.id} className="flex items-start gap-3 text-sm">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                        {(p?.nombres?.[0] || '?')}{(p?.apellidos?.[0] || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{nombre}</p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{a.tipo_problema}{a.descripcion ? ` — ${a.descripcion}` : ''}</p>
                      </div>
                      <Badge appearance="filled" color={ESTADO_BADGE[a.estado] || 'neutral'} size="small">
                        {a.estado}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Bienes por estado */}
        <Card className="!p-0 !shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Bienes por Estado</h2>
          </div>
          <div className="p-5">
            {bienesPorEstado.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin bienes registrados</p>
            ) : (
              <div className="space-y-3">
                {bienesPorEstado.map(([estado, count]) => {
                  const total = bienesPorEstado.reduce((s, [, c]) => s + c, 0)
                  const porcentaje = Math.round((count / total) * 100)
                  return (
                    <div key={estado}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <Badge appearance="filled" color={ESTADO_BIEN_BADGE[estado] || 'neutral'} size="small">
                          {estado}
                        </Badge>
                        <span className="text-gray-500 text-xs">{count} ({porcentaje}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard