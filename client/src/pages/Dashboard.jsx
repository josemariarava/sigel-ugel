import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  DesktopRegular, 
  PeopleRegular, 
  ClipboardTaskRegular, 
  MoneyRegular 
} from '@fluentui/react-icons'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBienes: 0,
    totalPersonas: 0,
    totalAsignaciones: 0,
    valorTotal: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      const [bienesResult, personasResult, asignacionesResult, valorResult] = await Promise.all([
        supabase.from('bienes').select('*', { count: 'exact', head: true }),
        supabase.from('personas').select('*', { count: 'exact', head: true }),
        supabase.from('asignaciones').select('*', { count: 'exact', head: true }),
        supabase.from('bienes').select('valor_compra'),
      ])

      const sumaValor = valorResult.data?.reduce((sum, item) => sum + (item.valor_compra || 0), 0) || 0

      setStats({
        totalBienes: bienesResult.count || 0,
        totalPersonas: personasResult.count || 0,
        totalAsignaciones: asignacionesResult.count || 0,
        valorTotal: sumaValor
      })
    } catch (error) {
      console.error('[Dashboard] Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const tarjetas = [
    { titulo: 'Total Bienes', valor: stats.totalBienes, icono: DesktopRegular, color: 'bg-blue-500' },
    { titulo: 'Total Personas', valor: stats.totalPersonas, icono: PeopleRegular, color: 'bg-green-500' },
    { titulo: 'Asignaciones', valor: stats.totalAsignaciones, icono: ClipboardTaskRegular, color: 'bg-purple-500' },
    { titulo: 'Valor Total', valor: `S/ ${stats.valorTotal.toFixed(2)}`, icono: MoneyRegular, color: 'bg-orange-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {tarjetas.map((tarjeta, index) => {
          const Icon = tarjeta.icono
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{tarjeta.titulo}</p>
                  <p className="text-2xl font-bold mt-2">{tarjeta.valor}</p>
                </div>
                <div className={`${tarjeta.color} p-3 rounded-full text-white flex items-center justify-center`}>
                  {/* Se maneja el tamaño usando la propiedad style y fontSize */}
                  <Icon style={{ fontSize: '24px' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Últimos bienes agregados */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Últimos Bienes Registrados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm">Tipo</th>
                <th className="px-4 py-2 text-left text-sm">Marca/Modelo</th>
                <th className="px-4 py-2 text-left text-sm">Código Patrimonial</th>
                <th className="px-4 py-2 text-left text-sm">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No hay bienes registrados aún
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard