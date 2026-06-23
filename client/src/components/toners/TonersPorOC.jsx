import { CartRegular, InfoRegular } from '@fluentui/react-icons'
import { Button, Card, Badge } from '@fluentui/react-components'

const StockBadge = ({ disponibles, total }) => {
    if (total === 0) return null
    const pct = disponibles / total
    if (pct === 0) return <Badge appearance="tint" color="danger" size="small">Agotado</Badge>
    if (pct <= 0.25) return <Badge appearance="tint" color="warning" size="small">Crítico</Badge>
    if (pct <= 0.5) return <Badge appearance="tint" color="important" size="small">Bajo</Badge>
    return <Badge appearance="tint" color="success" size="small">Stock</Badge>
}

const TonersPorOC = ({ compras, tonerCountsByDetalle = {}, onCompraClick, onAgregarMas }) => {
    if (compras.length === 0) {
        return (
            <Card className="!p-8">
                <div className="text-center text-gray-500">
                    <CartRegular className="text-2xl mb-2 opacity-30" />
                    <p className="text-sm font-medium">No hay compras de tóneres registradas</p>
                    <p className="text-xs mt-1">Usa "Registrar Compra Tóneres" para crear una orden de compra</p>
                </div>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        <div className="p-2.5">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start gap-2">
                                    <div className="w-1 bg-blue-600 rounded-full shrink-0 mt-0.5" style={{ height: '1.75rem' }} />
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            O/C {compra.orden_compra}
                                        </h3>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            {compra.proveedor || 'Sin proveedor'} · {compra.fecha_compra
                                                ? new Date(compra.fecha_compra + 'T00:00:00').toLocaleDateString('es-PE')
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                                <Badge appearance="filled" color="brand" size="small">
                                    {totalRecibido} tóner
                                </Badge>
                            </div>

                            {totalBienes > 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[200px]">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all"
                                            style={{ width: `${(totalDisp / totalBienes) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                                        {totalDisp}/{totalBienes} disponibles
                                    </span>
                                </div>
                            )}

                            <div className="space-y-0.5 mt-2">
                                {compra.detalles?.map((det) => {
                                    const pct = det.cantidad_pedida > 0
                                        ? (det.cantidad_recibida / det.cantidad_pedida) * 100
                                        : 0
                                    const real = tonerCountsByDetalle[det.id]
                                    const disp = real?.activos || 0
                                    const total = real?.total || 0

                                    return (
                                        <div key={det.id} className="flex items-center gap-2 text-xs bg-white border border-gray-100 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                            <span className="truncate min-w-0 text-gray-700">
                                                {det.marca} {det.modelo}
                                            </span>
                                            {det.color_toner && (
                                                <span className="text-[10px] text-gray-400 uppercase shrink-0">{det.color_toner}</span>
                                            )}
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[180px]">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] text-gray-500 font-mono whitespace-nowrap">
                                                {det.cantidad_recibida}/{det.cantidad_pedida}
                                            </span>
                                            <StockBadge disponibles={disp} total={total} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {compra.observaciones && (
                            <div className="bg-gray-50/50 border-t border-gray-100 px-2.5 py-1.5">
                                <p className="text-[11px] text-gray-500 italic truncate leading-relaxed">
                                    {compra.observaciones}
                                </p>
                            </div>
                        )}

                        <div className="border-t border-gray-100 px-2.5 py-1.5 bg-white flex justify-between items-center">
                            <Button
                                appearance="subtle"
                                icon={<CartRegular />}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onAgregarMas(compra)
                                }}
                            >
                                + Agregar más
                            </Button>
                            <Button
                                appearance="primary"
                                size="small"
                                icon={<InfoRegular />}
                                onClick={() => onCompraClick(compra)}
                            >
                                Ver detalle
                            </Button>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}

export default TonersPorOC
