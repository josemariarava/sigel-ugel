export const GRUPOS = {
    especificaciones: ['procesador', 'ram', 'almacenamiento', 'tipo_almacenamiento', 'sistema_operativo', 'direccion_mac'],
    pantalla: ['tamano_pantalla'],
    toner: ['color_toner', 'rendimiento', 'lote', 'fecha_vencimiento', 'proveedor', 'ubicacion_almacen']
}

export const CAMPOS_POR_TIPO = {
    Laptop: { grupos: ['especificaciones'], color: true, condicion: true },
    Desktop: { grupos: ['especificaciones'], color: true, condicion: true },
    CPU: { grupos: ['especificaciones'], color: true, condicion: true },
    Tablet: { grupos: ['especificaciones'], color: true, condicion: true },
    'All-in-One': { grupos: ['especificaciones'], color: true, condicion: true },
    Monitor: { grupos: ['pantalla'], color: true, condicion: true },
    Impresora: { grupos: [], color: true, condicion: true },
    Multifuncional: { grupos: [], color: true, condicion: true },
    Proyector: { grupos: [], color: true, condicion: true },
    Escáner: { grupos: [], color: true, condicion: true },
    Plotter: { grupos: [], color: true, condicion: true },
    Cámara: { grupos: [], color: true, condicion: true },
    Teclado: { grupos: [], color: true, condicion: true },
    Mouse: { grupos: [], color: true, condicion: true },
    Parlantes: { grupos: [], color: true, condicion: true },
    Router: { grupos: [], color: true, condicion: true },
    Switch: { grupos: [], color: true, condicion: true },
    'Tóner': { grupos: ['toner'], color: false, condicion: false },
    'Contenedor de Tóner (Residuo)': { grupos: ['toner'], color: false, condicion: false },
    Cartucho: { grupos: [], color: true, condicion: true },
    Batería: { grupos: [], color: true, condicion: true },
    Otro: { grupos: [], color: true, condicion: true }
}

const FALLBACK = { grupos: [], color: true, condicion: true }

export const getConfigTipo = (tipo) => CAMPOS_POR_TIPO[tipo] || FALLBACK

export const getCamposAplicables = (tipo) => {
    const cfg = getConfigTipo(tipo)
    const campos = new Set([
        'tipo_equipo', 'serie', 'marca', 'modelo', 'marca_id', 'modelo_id',
        'codigo_patrimonial', 'codigo_ti', 'anio_compra', 'orden_compra',
        'valor_compra', 'estado', 'other'
    ])
    if (cfg.color) campos.add('color')
    if (cfg.condicion) campos.add('condicion')
    cfg.grupos.forEach(g => (GRUPOS[g] || []).forEach(c => campos.add(c)))
    return campos
}