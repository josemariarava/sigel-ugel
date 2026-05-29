import { CartRegular } from '@fluentui/react-icons'
import {
    Button,
    Card,
    Badge
} from '@fluentui/react-components'

const StockBadge = ({ disponibles, total }) => {
    if (total === 0) return null
    const pct = disponibles / total
    if (pct === 0) return <Badge appearance="filled" color="danger">Agotado</Badge>
    if (pct <= 0.25) return <Badge appearance="filled" color="warning">Crítico</Badge>
    if (pct <= 0.5) return <Badge appearance="filled" color="important">Bajo</Badge>
    return <Badge appearance="filled" color="success">Stock</Badge>
}

const TonersPorOC = ({ compras, tonerCountsByDetalle = {}, onCompraClick, onAgregarMas }) => {
    if (compras.length === 0) {
        return (
            <Card className="!p-12">
                <div className="text-center text-gray-500">
                    <CartRegular className="text-4xl mb-3 opacity-30" />
                    <p className="font-medium">No hay compras de tóneres registradas</p>
                    <p className="text-sm mt-1">Usa "Registrar Compra Tóneres" para crear una orden de compra</p>
                </div>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {compras.map((compra) => {
                const totalRecibido = compra.detalles?.reduce((s, d) => s + (d.cantidad_recibida || 0), 0) || 0
                const totalBienes = compra.detalles?.reduce((s, d) => s + (tonerCountsByDetalle[d.id]?.total || 0), 0) || 0
                const totalDisp = compra.detalles?.reduce((s, d) => s + (tonerCountsByDetalle[d.id]?.activos || 0), 0) || 0

                return (
                    <Card
                        key={compra.id}
                        className="!p-0 cursor-pointer hover:shadow-lg transition-shadow group"
                        onClick={() => onCompraClick(compra)}
                    >
                        <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-blue-700">
                                        O/C {compra.orden_compra}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {compra.proveedor || 'Sin proveedor'} · {compra.fecha_compra
                                            ? new Date(compra.fecha_compra + 'T00:00:00').toLocaleDateString('es-PE')
                                            : '-'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {totalBienes > 0 && (
                                        <span className="text-xs text-gray-500 font-mono">
                                            {totalDisp}/{totalBienes} disp.
                                        </span>
                                    )}
                                    <Badge appearance="filled" color="brand" size="medium">
                                        {totalRecibido} tóner
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                {compra.detalles?.map((det) => {
                                    const pct = det.cantidad_pedida > 0
                                        ? (det.cantidad_recibida / det.cantidad_pedida) * 100
                                        : 0
                                    const real = tonerCountsByDetalle[det.id]
                                    const disp = real?.activos || 0
                                    const total = real?.total || 0

                                    return (
                                        <div key={det.id} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-1.5">
                                            <span className="font-medium text-gray-700 min-w-[120px] truncate">
                                                {det.marca} {det.modelo}
                                            </span>
                                            {det.color_toner && (
                                                <span className="text-[10px] uppercase text-gray-400">{det.color_toner}</span>
                                            )}
                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                                                {det.cantidad_recibida}/{det.cantidad_pedida}
                                            </span>
                                            {total > 0 && (
                                                <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                                                    · {disp}/{total} disp
                                                </span>
                                            )}
                                            <StockBadge disponibles={disp} total={total} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {compra.observaciones && (
                            <div className="border-t border-gray-100 px-4 py-2">
                                <p className="text-[11px] text-gray-400 italic truncate">{compra.observaciones}</p>
                            </div>
                        )}

                        <div className="border-t border-gray-100 px-4 py-2 bg-gradient-to-r from-blue-50 to-transparent flex justify-between items-center">
                            <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                                👆 Haz clic para ver detalle
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    appearance="subtle"
                                    icon={<CartRegular />}
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onAgregarMas(compra)
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    + Agregar más
                                </Button>
                                <span className="text-xs font-medium text-blue-600">Ver tóneres →</span>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}

export default TonersPorOC
