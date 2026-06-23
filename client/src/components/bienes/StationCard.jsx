import { Card, Badge, Text } from '@fluentui/react-components'
import { DesktopRegular } from '@fluentui/react-icons'

const tipoAbreviado = (tipo) => {
    const map = {
        Laptop: 'Laptop',
        Desktop: 'Desktop',
        CPU: 'CPU',
        Tablet: 'Tablet',
        'All-in-One': 'All-in-One',
        Monitor: 'Monitor',
        Teclado: 'Teclado',
        Mouse: 'Mouse',
        Impresora: 'Impresora',
        Proyector: 'Proyector',
        Parlantes: 'Parlantes',
        Diadema: 'Diadema',
        Webcam: 'Webcam',
        Router: 'Router',
        Switch: 'Switch',
    }
    const maxLen = 10
    const short = map[tipo] || tipo
    return short.length > maxLen ? short.slice(0, maxLen) + '…' : short
}

const determinarEstadoGeneral = (assets) => {
    let hasBad = false
    let hasRegular = false
    for (const a of assets) {
        if (a.condicion === 'Malo' || a.condicion === 'Chatarra') hasBad = true
        else if (a.condicion === 'Regular') hasRegular = true
    }
    if (hasBad) return { label: 'Requiere atención', color: 'bg-red-500', textColor: 'text-red-600' }
    if (hasRegular) return { label: 'Algunos regulares', color: 'bg-amber-500', textColor: 'text-amber-600' }
    return { label: 'Buen estado', color: 'bg-green-500', textColor: 'text-green-600' }
}

const StationCard = ({ codigoTi, count, assets, onClick }) => {
    const tiposUnicos = [...new Set(assets?.map(a => a.tipo_equipo) || [])]
    const estadoGeneral = determinarEstadoGeneral(assets || [])

    return (
        <Card
            className="cursor-pointer hover:shadow-sm transition-all border border-gray-100 border-l-2 border-l-blue-400 !p-4 bg-blue-50/20"
            onClick={onClick}
        >
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <DesktopRegular className="text-blue-600 w-6 h-6 shrink-0" />
                        <Text weight="semibold" size={400} className="truncate">
                            {codigoTi}
                        </Text>
                    </div>
                    <Badge appearance="filled" size="small" className="shrink-0 ml-2">
                        {count}
                    </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {tiposUnicos.map(tipo => (
                        <span key={tipo} className="text-[11px] bg-blue-50/50 text-gray-500 px-2 py-0.5 rounded-md font-medium">
                            {tipoAbreviado(tipo)}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${estadoGeneral.color} inline-block`} />
                    <span className={`text-xs font-medium ${estadoGeneral.textColor}`}>
                        {estadoGeneral.label}
                    </span>
                </div>
            </div>
        </Card>
    )
}

export default StationCard
