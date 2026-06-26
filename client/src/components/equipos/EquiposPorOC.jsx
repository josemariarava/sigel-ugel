import { EditRegular, DesktopRegular, LaptopRegular, TvRegular, PrintRegular } from '@fluentui/react-icons'
import {
    Button,
    Card,
    Badge
} from '@fluentui/react-components'

const tipoIcono = (tipo) => {
    switch (tipo) {
        case 'Laptop': return <LaptopRegular className="text-blue-500" />
        case 'Desktop':
        case 'CPU': return <DesktopRegular className="text-orange-500" />
        case 'Monitor': return <TvRegular className="text-green-500" />
        case 'Impresora':
        case 'Multifuncional': return <PrintRegular className="text-purple-500" />
        default: return <DesktopRegular className="text-gray-500" />
    }
}

const EquiposPorOC = ({ compras, bienesSinOC = [], onCompraClick, onAgregarMas, onBienSinOClick }) => {
    const sinOCSection = bienesSinOC.length > 0 && (
        <Card className="!p-0 !border-amber-200 !bg-amber-50/30">
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Badge appearance="filled" color="warning" size="large">{bienesSinOC.length}</Badge>
                        <h3 className="text-base font-bold text-amber-800">
                            Equipo(s) sin orden de compra
                        </h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {bienesSinOC.slice(0, 12).map((bien) => (
                        <div key={bien.id} className="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-1.5 border border-amber-100">
                            <span className="flex-shrink-0">{tipoIcono(bien.tipo_equipo)}</span>
                            <span className="font-medium text-gray-700 truncate min-w-[80px]">
                                {bien.tipo_equipo}
                            </span>
                            <span className="text-gray-500 truncate text-xs">
                                {bien.marca} {bien.modelo}
                            </span>
                            <Button
                                appearance="subtle"
                                icon={<EditRegular />}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onBienSinOClick(bien)
                                }}
                                className="ml-auto shrink-0"
                            />
                        </div>
                    ))}
                    {bienesSinOC.length > 12 && (
                        <p className="text-xs text-gray-400 col-span-full text-center pt-1">
                            ... y {bienesSinOC.length - 12} más
                        </p>
                    )}
                </div>
            </div>
        </Card>
    )

    if (compras.length === 0 && bienesSinOC.length === 0) {
        return (
            <Card className="!p-12">
                <div className="text-center text-gray-500">
                    <DesktopRegular className="text-4xl mb-3 opacity-30" />
                    <p className="font-medium">No hay compras de equipos registradas</p>
                    <p className="text-sm mt-1">Usa "Registrar Compra Equipos" para crear una orden de compra</p>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {sinOCSection}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {compras.map((compra) => {
                const totalEquipos = compra.detalles?.length || 0

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
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                        <p className="text-xs text-gray-500">
                                            {compra.razon_social || 'Sin proveedor'}
                                        </p>
                                        {compra.ruc && (
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">
                                                RUC {compra.ruc}
                                            </span>
                                        )}
                                        {compra.mes_calendario && (
                                            <span className="text-[10px] text-gray-400">
                                                📅 {compra.mes_calendario}
                                            </span>
                                        )}
                                        {compra.fecha_compra && (
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(compra.fecha_compra + 'T00:00:00').toLocaleDateString('es-PE')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Badge appearance="filled" color="brand" size="medium">
                                    {totalEquipos} equipo(s)
                                </Badge>
                            </div>

                            <div className="space-y-1.5">
                                {compra.detalles?.map((det) => (
                                    <div key={det.id} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-1.5">
                                        <span className="flex-shrink-0">{tipoIcono(det.tipo_equipo)}</span>
                                        <span className="font-medium text-gray-700 min-w-[100px] truncate">
                                            {det.tipo_equipo}
                                        </span>
                                        <span className="text-gray-500 truncate">
                                            {det.marca} {det.modelo}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono ml-auto">
                                            S/{det.costo_unitario ? Number(det.costo_unitario).toFixed(2) : '—'}
                                        </span>
                                    </div>
                                ))}
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
                                    icon={<DesktopRegular />}
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onAgregarMas(compra)
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    + Agregar más
                                </Button>
                                <span className="text-xs font-medium text-blue-600">Ver equipos →</span>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
        </div>
    )
}

export default EquiposPorOC
