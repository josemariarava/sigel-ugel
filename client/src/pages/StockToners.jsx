import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    Tab,
    TabList,
    Input,
    Badge,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Button,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle
} from '@fluentui/react-components'
import { SearchRegular, CartRegular, DismissRegular } from '@fluentui/react-icons'
import { TIPOS_TONER } from '../lib/utils'

const StockToners = () => {
    const [view, setView] = useState('modelo')
    const [search, setSearch] = useState('')
    const [compras, setCompras] = useState([])
    const [toners, setToners] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedModel, setSelectedModel] = useState(null)
    const [asignaciones, setAsignaciones] = useState([])

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setLoading(true)
        try {
            const [comprasRes, tonersRes, asignacionesRes] = await Promise.all([
                supabase
                    .from('compras_toners')
                    .select('*, detalles:compra_detalles(*)')
                    .order('fecha_compra', { ascending: false }),
                supabase
                    .from('bienes')
                    .select('id, compra_detalle_id, estado, marca, modelo, color_toner, serie, lote, ubicacion_almacen, fecha_vencimiento, veces_asignado')
                    .in('tipo_equipo', TIPOS_TONER)
                    .in('estado', ['Disponible', 'Asignado', 'Activo', 'Agotado']),
                supabase
                    .from('asignacion_toners')
                    .select('toner_id, fecha_asignacion, persona:personas!asignacion_toners_persona_id_fkey(apellidos, nombres)')
            ])
            setCompras(comprasRes.data || [])
            setToners(tonersRes.data || [])
            setAsignaciones(asignacionesRes.data || [])
        } catch (e) {
            console.error('Error al cargar stock:', e.message)
        } finally {
            setLoading(false)
        }
    }

    const stockPorModelo = useMemo(() => {
        const map = {}
        toners.forEach(t => {
            const key = `${t.marca}||${t.modelo}`
            if (!map[key]) {
                map[key] = { marca: t.marca, modelo: t.modelo, activos: 0, asignados: 0, agotados: 0, total: 0 }
            }
            if (t.estado === 'Disponible' || t.estado === 'Activo') map[key].activos++
            else if (t.estado === 'Asignado') map[key].asignados++
            else map[key].agotados++
            map[key].total++
        })
        return Object.values(map)
            .filter(m => !search || `${m.marca} ${m.modelo}`.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo))
    }, [toners, search])

    const tonerPorDetalle = useMemo(() => {
        const map = {}
        toners.forEach(t => {
            if (!t.compra_detalle_id) return
            if (!map[t.compra_detalle_id]) {
                map[t.compra_detalle_id] = { activos: 0, asignados: 0, agotados: 0, total: 0 }
            }
            if (t.estado === 'Disponible' || t.estado === 'Activo') map[t.compra_detalle_id].activos++
            else if (t.estado === 'Asignado') map[t.compra_detalle_id].asignados++
            else map[t.compra_detalle_id].agotados++
            map[t.compra_detalle_id].total++
        })
        return map
    }, [toners])

    const comprasFiltradas = useMemo(() => {
        if (!search) return compras
        return compras.filter(c =>
            c.orden_compra?.toLowerCase().includes(search.toLowerCase()) ||
            c.proveedor?.toLowerCase().includes(search.toLowerCase())
        )
    }, [compras, search])

    const BadgeStock = ({ disponibles, asignados = 0, agotados = 0, total }) => {
        if (total === 0) return <Badge appearance="filled" color="danger">Sin stock</Badge>
        if (disponibles > 0) {
            const pct = disponibles / total
            if (pct <= 0.25) return <Badge appearance="filled" color="warning">Crítico</Badge>
            if (pct <= 0.5) return <Badge appearance="filled" color="important">Bajo</Badge>
            return <Badge appearance="filled" color="success">Disponible</Badge>
        }
        if (asignados > 0 && agotados === 0) return <Badge appearance="filled" color="warning">Todos en uso</Badge>
        return <Badge appearance="filled" color="danger">Sin stock</Badge>
    }

    const tonersDelModelo = useMemo(() => {
        if (!selectedModel) return []
        return toners.filter(t =>
            t.marca === selectedModel.marca && t.modelo === selectedModel.modelo
        )
    }, [toners, selectedModel])

    const asignacionPorToner = useMemo(() => {
        const map = {}
        asignaciones.forEach(a => { map[a.toner_id] = a })
        return map
    }, [asignaciones])

    const totales = useMemo(() => {
        return toners.reduce((acc, t) => {
            if (t.estado === 'Disponible' || t.estado === 'Activo') acc.disponibles++
            else if (t.estado === 'Asignado') acc.asignados++
            else acc.agotados++
            return acc
        }, { disponibles: 0, asignados: 0, agotados: 0 })
    }, [toners])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-400">Cargando datos de stock...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">📊 Stock de Tóneres</h1>
                        <p className="text-sm text-gray-500 mt-1">Control de inventario y disponibilidad</p>
                    </div>
                    <Button appearance="subtle" icon={<CartRegular />} onClick={cargarDatos}>
                        Refrescar
                    </Button>
                </div>

                {/* Totals bar */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-700">{toners.length}</p>
                        <p className="text-xs text-blue-600">Total tóneres</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-700">{totales.disponibles}</p>
                        <p className="text-xs text-green-600">Disponibles</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-amber-700">{totales.asignados}</p>
                        <p className="text-xs text-amber-600">Asignados</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-700">{totales.agotados}</p>
                        <p className="text-xs text-gray-600">Agotados</p>
                    </div>
                </div>

                {/* Search + Tabs */}
                <div className="flex items-center gap-4">
                    <Input
                        contentBefore={<SearchRegular />}
                        placeholder="Buscar por modelo, O/C o proveedor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1"
                        appearance="filled-darker"
                    />
                    <TabList selectedValue={view} onTabSelect={(_, d) => setView(d.value)}>
                        <Tab value="modelo">Por Modelo</Tab>
                        <Tab value="oc">Por O/C</Tab>
                    </TabList>
                </div>
            </div>

            {/* Por Modelo */}
            {view === 'modelo' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {stockPorModelo.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            {search ? 'No se encontraron modelos con ese filtro' : 'No hay tóneres registrados'}
                        </div>
                    ) : (
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>Marca</TableHeaderCell>
                                    <TableHeaderCell>Modelo</TableHeaderCell>
                                    <TableHeaderCell className="text-center">Total</TableHeaderCell>
                                    <TableHeaderCell className="text-center">Disponibles</TableHeaderCell>
                                    <TableHeaderCell className="text-center">Asignados</TableHeaderCell>
                                    <TableHeaderCell className="text-center">Agotados</TableHeaderCell>
                                    <TableHeaderCell>Stock</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockPorModelo.map((item) => (
                                    <TableRow
                                        key={`${item.marca}${item.modelo}`}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedModel({ marca: item.marca, modelo: item.modelo })}
                                    >
                                        <TableCell className="font-medium">{item.marca}</TableCell>
                                        <TableCell>{item.modelo}</TableCell>
                                        <TableCell className="text-center font-mono">{item.total}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-mono font-medium text-green-700">{item.activos}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-mono font-medium text-amber-700">{item.asignados}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-mono text-gray-500">{item.agotados}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                                                    <div
                                                        className="h-2 rounded-full bg-green-500 transition-all"
                                                        style={{ width: `${item.total > 0 ? (item.activos / item.total) * 100 : 0}%` }}
                                                    />
                                                </div>
                                                <BadgeStock disponibles={item.activos} asignados={item.asignados} agotados={item.agotados} total={item.total} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            )}

            {/* Por O/C */}
            {view === 'oc' && (
                <div className="grid grid-cols-1 gap-4">
                    {comprasFiltradas.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
                            {search ? 'No se encontraron órdenes con ese filtro' : 'No hay órdenes de compra registradas'}
                        </div>
                    ) : (
                        comprasFiltradas.map((compra) => {
                            const totalOC = compra.detalles?.reduce((s, d) => {
                                const real = tonerPorDetalle[d.id]
                                return s + (real?.total || 0)
                            }, 0) || 0
                            const dispOC = compra.detalles?.reduce((s, d) => {
                                const real = tonerPorDetalle[d.id]
                                return s + (real?.activos || 0)
                            }, 0) || 0
                            const asigOC = compra.detalles?.reduce((s, d) => {
                                const real = tonerPorDetalle[d.id]
                                return s + (real?.asignados || 0)
                            }, 0) || 0
                            const agotOC = compra.detalles?.reduce((s, d) => {
                                const real = tonerPorDetalle[d.id]
                                return s + (real?.agotados || 0)
                            }, 0) || 0

                            return (
                                <div key={compra.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <span className="font-bold text-lg text-slate-800">
                                                O/C {compra.orden_compra}
                                            </span>
                                            <p className="text-xs text-gray-500">
                                                {compra.proveedor || 'Sin proveedor'} · {compra.fecha_compra
                                                    ? new Date(compra.fecha_compra + 'T00:00:00').toLocaleDateString('es-PE')
                                                    : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BadgeStock disponibles={dispOC} asignados={asigOC} agotados={agotOC} total={totalOC} />
                                            <span className="text-xs text-gray-500 font-mono">
                                                {dispOC}/{totalOC}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Overall progress bar */}
                                    <div className="bg-gray-200 rounded-full h-2.5 mb-4">
                                        <div
                                            className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                                            style={{ width: `${totalOC > 0 ? (dispOC / totalOC) * 100 : 0}%` }}
                                        />
                                    </div>

                                    {/* Per-model breakdown */}
                                    <div className="space-y-2">
                                        {compra.detalles?.map((det) => {
                                            const real = tonerPorDetalle[det.id]
                                            const total = real?.total || 0
                                            const disp = real?.activos || 0
                                            if (total === 0) return null
                                            return (
                                                <div key={det.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                                                    <Badge appearance="filled" color="brand" size="small">
                                                        {det.marca} {det.modelo}
                                                    </Badge>
                                                    {det.color_toner && (
                                                        <span className="text-[10px] uppercase text-gray-400">{det.color_toner}</span>
                                                    )}
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className="h-1.5 rounded-full bg-green-400"
                                                                style={{ width: `${(disp / total) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono text-gray-600 whitespace-nowrap">
                                                            {disp}/{total}
                                                        </span>
                                                    </div>
                                                    <BadgeStock disponibles={disp} asignados={real?.asignados} agotados={real?.agotados} total={total} />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}
            {/* Detail drawer for modelo */}
            <Drawer
                position="end"
                open={!!selectedModel}
                onOpenChange={(_, d) => { if (!d.open) setSelectedModel(null) }}
                style={{ width: "700px" }}
            >
                <DrawerHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                    <DrawerHeaderTitle
                        action={
                            <Button
                                appearance="subtle"
                                icon={<DismissRegular />}
                                onClick={() => setSelectedModel(null)}
                            />
                        }
                    >
                        <span className="text-lg font-bold text-slate-800">
                            📦 {selectedModel?.marca} {selectedModel?.modelo}
                        </span>
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody className="p-4">
                    {tonersDelModelo.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            No se encontraron tóneres
                        </div>
                    ) : (
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>Serie</TableHeaderCell>
                                    <TableHeaderCell>Estado</TableHeaderCell>
                                    <TableHeaderCell>Ubicación</TableHeaderCell>
                                    <TableHeaderCell>Asignado a</TableHeaderCell>
                                    <TableHeaderCell>Días</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tonersDelModelo.map((t) => (
                                    <TableRow key={t.id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell className="font-mono text-xs">{t.serie || '—'}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                t.estado === 'Disponible' || t.estado === 'Activo'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : t.estado === 'Asignado'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-gray-200 text-gray-800'
                                            }`}>
                                                {t.estado}
                                            </span>
                                            {t.estado === 'Disponible' && t.veces_asignado > 0 && (
                                                <span className="ml-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                                    ↩️ {t.veces_asignado} uso{t.veces_asignado !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs">{t.ubicacion_almacen || '—'}</TableCell>
                                        <TableCell className="text-xs">
                                            {asignacionPorToner[t.id]
                                                ? `${asignacionPorToner[t.id].persona?.apellidos || ''}, ${asignacionPorToner[t.id].persona?.nombres || ''}`
                                                : '—'
                                            }
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            {(() => {
                                                const a = asignacionPorToner[t.id]
                                                if (!a) return '—'
                                                const diff = Math.floor((Date.now() - new Date(a.fecha_asignacion).getTime()) / (1000 * 60 * 60 * 24))
                                                if (diff === 0) return 'Hoy'
                                                if (diff === 1) return '1 día'
                                                return diff + ' días'
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DrawerBody>
            </Drawer>
        </div>
    )
}

export default StockToners
