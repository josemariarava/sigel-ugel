export const getEstadoColorToner = (estado) => {
    switch (estado) {
        case 'Activo': return 'bg-green-50 text-green-700 border-green-200'
        case 'Terminado': return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'Caducado': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
        case 'Dado de Baja': return 'bg-red-50 text-red-700 border-red-200'
        default: return 'bg-slate-100 text-slate-600'
    }
}

export const getEstadoColorAsignacion = (estado) => {
    switch (estado) {
        case 'Activo': return 'bg-green-50 text-green-700 border-green-200'
        case 'Trasladado': return 'bg-amber-50 text-amber-700 border-amber-200'
        case 'Devuelto': return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'Baja': return 'bg-red-50 text-red-700 border-red-200'
        default: return 'bg-slate-100 text-slate-600'
    }
}
