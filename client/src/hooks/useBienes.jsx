import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'
import {
    Toast,
    ToastTitle,
    ToastBody,
    useToastController
} from '@fluentui/react-components'

const categorias = {
    computo: ['Laptop', 'Desktop', 'CPU', 'Tablet', 'All-in-One'],
    impresoras: ['Impresora', 'Proyector', 'Multifuncional', 'Escáner', 'Plotter'],
    perifericos: ['Monitor', 'Teclado', 'Mouse', 'Parlantes', 'Diadema', 'Webcam', 'Router', 'Switch'],
    consumibles: ['Tóner', 'Cartucho', 'Cinta', 'Batería', 'Cargador'],
    otros: []
}

const emptyForm = {
    tipo_equipo: '',
    marca: '',
    modelo: '',
    marca_id: '',
    modelo_id: '',
    color: '',
    other: '',
    codigo_ti: null,
    codigo_patrimonial: '',
    serie: '',
    anio_compra: new Date().getFullYear(),
    orden_compra: '',
    condicion: 'Bueno',
    valor_compra: '',
    estado: 'Activo',
    color_toner: '',
    rendimiento: '',
    lote: '',
    fecha_vencimiento: '',
    proveedor: '',
    ubicacion_almacen: '',
    procesador: '',
    ram: '',
    almacenamiento: '',
    tipo_almacenamiento: '',
    sistema_operativo: '',
    direccion_mac: '',
    tamano_pantalla: ''
}

const safeParseFloat = (val) => (val !== '' && val != null ? parseFloat(val) : null)
const safeParseInt = (val) => (val !== '' && val != null ? parseInt(val) : null)
const generarSerieUnica = () => `SIN-SERIE-${crypto.randomUUID().slice(0, 8)}`
const determinarEstado = (tipoEquipo, condicion) => {
    if (tipoEquipo === 'Tóner') return 'Disponible'
    if (condicion === 'Chatarra') return 'Dado de Baja'
    if (condicion === 'Malo') return 'Inactivo'
    return 'Activo'
}

const AGENTITO_URLS = ['http://localhost:5899', 'http://127.0.0.1:5899']

const cache = new Map()
const TTL = 5 * 60 * 1000
const TTL_CATALOGO = 30 * 60 * 1000

function getCached(key, ttl) {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > ttl) {
        cache.delete(key)
        return null
    }
    return entry.data
}

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() })
}

const useBienes = () => {
    const [bienes, setBienes] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [openDrawer, setOpenDrawer] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedBien, setSelectedBien] = useState(null)
    const [activeTab, setActiveTab] = useState('estaciones')

    const [marcas, setMarcas] = useState([])
    const [modelos, setModelos] = useState([])
    const [modelosFiltrados, setModelosFiltrados] = useState([])
    const [exportando, setExportando] = useState(false)

    const [comprasAgrupadas, setComprasAgrupadas] = useState([])
    const [openDetalleDrawer, setOpenDetalleDrawer] = useState(false)
    const [openCompraDrawer, setOpenCompraDrawer] = useState(false)
    const [selectedCompra, setSelectedCompra] = useState(null)
    const [selectedCompraToners, setSelectedCompraToners] = useState([])
    const [prefillCompraId, setPrefillCompraId] = useState('')

    const [comprasEquipos, setComprasEquipos] = useState([])
    const [openDetalleEquipoDrawer, setOpenDetalleEquipoDrawer] = useState(false)
    const [openCompraEquipoDrawer, setOpenCompraEquipoDrawer] = useState(false)
    const [selectedCompraEquipo, setSelectedCompraEquipo] = useState(null)
    const [selectedCompraEquipos, setSelectedCompraEquipos] = useState([])
    const [prefillCompraEquipoId, setPrefillCompraEquipoId] = useState('')
    const [openImportarExcelDrawer, setOpenImportarExcelDrawer] = useState(false)
    const [bienesSinOC, setBienesSinOC] = useState([])
    const [filtroOC, setFiltroOC] = useState('todos')
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 25

    const [ambientes, setAmbientes] = useState([])

    const [formData, setFormData] = useState({ ...emptyForm })

    const { dispatchToast } = useToastController()

    const [tonerCountsByDetalle, setTonerCountsByDetalle] = useState({})
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [diagnostico, setDiagnostico] = useState(null)
    const [monitoresDetectados, setMonitoresDetectados] = useState([])
    const [monitorSeleccionadoIndex, setMonitorSeleccionadoIndex] = useState(null)

    async function fetchAgentito(path) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)
      try {
        const res = await Promise.any(
          AGENTITO_URLS.map(base => fetch(base + path, { signal: controller.signal }).then(r => {
            if (!r.ok) throw new Error('Status ' + r.status)
            return r
          }))
        )
        clearTimeout(timeoutId)
        return res
      } catch {
        clearTimeout(timeoutId)
        return null
      }
    }

    async function diagnosticar() {
      const res = await fetchAgentito('/api/diagnose')
      if (!res) {
        setDiagnostico({ error: true, mensaje: 'No se pudo conectar al agentito. Verifica que agentito.exe esté ejecutándose como Administrador.' })
        return
      }
      try {
        const data = await res.json()
        setDiagnostico({ error: false, ...data })
      } catch {
        setDiagnostico({ error: true, mensaje: 'El agentito respondió pero con datos inválidos.' })
      }
    }

    // Stats se calculan desde una query ligera (solo tipo_equipo, sin filtros)
    const [statsLight, setStatsLight] = useState([])

    const getTiposParaTab = (tab) => {
        const tipos = categorias[tab]
        if (tab === 'otros') return null
        return tipos || []
    }

    useEffect(() => {
        cargarCatalogo()
        loadStats()
    }, [])

    useEffect(() => {
        if (activeTab === 'consumibles') {
            setBienes([])
            cargarCompras(searchTerm)
        } else if (activeTab === 'equipos') {
            setBienes([])
            cargarComprasEquipos(searchTerm)
            cargarBienesSinOC()
        } else {
            cargarBienesPorCategoria(activeTab)
        }
    }, [activeTab])

    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        if (activeTab === 'consumibles') {
            cargarCompras(debouncedSearch)
        } else if (activeTab === 'equipos') {
            cargarComprasEquipos(debouncedSearch)
            cargarBienesSinOC()
        }
    }, [debouncedSearch])

    const mostrarToast = (mensaje, tipo = 'success') => {
        dispatchToast(
            <Toast>
                <ToastTitle>{tipo === 'success' ? '✅ Éxito' : '❌ Error'}</ToastTitle>
                <ToastBody>{mensaje}</ToastBody>
            </Toast>,
            { intent: tipo }
        )
    }

    const cargarBienesPorCategoria = async (tab, forceRefresh = false) => {
        const cacheKey = `bienes_${tab}`
        if (!forceRefresh) {
            const cached = getCached(cacheKey, TTL)
            if (cached) {
                setBienes(cached)
                setLoading(false)
                return
            }
        }
        try {
            setLoading(true)
            let query = supabase
                .from('bienes')
                .select('*')

            const tipos = getTiposParaTab(tab)
            if (tipos) {
                if (tipos.length > 0) {
                    query = query.in('tipo_equipo', tipos)
                }
            } else {
                // 'otros': excluir todas las categorías conocidas
                const excluir = [...categorias.computo, ...categorias.impresoras, ...categorias.perifericos, ...categorias.consumibles]
                query = query.not('tipo_equipo', 'in', `("${excluir.join('","')}")`)
            }

            const { data, error } = await query.order('created_at', { ascending: false })

            if (error) throw error
            setCache(cacheKey, data || [])
            setBienes(data || [])
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar bienes'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const cargarCatalogo = async (forceRefresh = false) => {
        const cacheKey = 'catalogo'
        if (!forceRefresh) {
            const cached = getCached(cacheKey, TTL_CATALOGO)
            if (cached) {
                setMarcas(cached.marcas)
                setModelos(cached.modelos)
                setAmbientes(cached.ambientes)
                return
            }
        }
        try {
            const [marcasRes, modelosRes, ambientesRes] = await Promise.all([
                supabase.from('marcas').select('*').order('nombre'),
                supabase.from('modelos').select('*').order('nombre'),
                supabase.from('ambientes').select('*').order('nombre')
            ])
            if (marcasRes.error) throw marcasRes.error
            if (modelosRes.error) throw modelosRes.error
            setCache(cacheKey, {
                marcas: marcasRes.data || [],
                modelos: modelosRes.data || [],
                ambientes: ambientesRes.data || []
            })
            setMarcas(marcasRes.data || [])
            setModelos(modelosRes.data || [])
            setAmbientes(ambientesRes.data || [])
        } catch (error) {
            console.error('Error al cargar catálogo:', error.message)
        }
    }

    const loadStats = async (forceRefresh = false) => {
        const cacheKey = 'stats'
        if (!forceRefresh) {
            const cached = getCached(cacheKey, TTL)
            if (cached) {
                setStatsLight(cached)
                return
            }
        }
        try {
            const { data } = await supabase
                .from('bienes')
                .select('tipo_equipo, estado')
            setCache(cacheKey, data || [])
            setStatsLight(data || [])
        } catch (error) {
            console.error('Error al cargar estadísticas:', error.message)
        }
    }

    const cargarCompras = async (term = '') => {
        try {
            const [comprasRes, tonersRes] = await Promise.all([
                (() => {
                    let query = supabase
                        .from('compras_toners')
                        .select('*, detalles:compra_detalles(*)')
                        .order('fecha_compra', { ascending: false })
                    if (term) {
                        query = query.or(
                            `orden_compra.ilike.%${term}%,proveedor.ilike.%${term}%`
                        )
                    }
                    return query
                })(),
                supabase
                    .from('bienes')
                    .select('compra_detalle_id, estado')
                    .eq('tipo_equipo', 'Tóner')
                    .not('compra_detalle_id', 'is', null)
            ])
            if (comprasRes.error) throw comprasRes.error
            setComprasAgrupadas(comprasRes.data || [])

            const counts = {}
            ;(tonersRes.data || []).forEach(t => {
                if (!counts[t.compra_detalle_id]) {
                    counts[t.compra_detalle_id] = { activos: 0, asignados: 0, agotados: 0, total: 0 }
                }
                if (t.estado === 'Activo' || t.estado === 'Disponible') counts[t.compra_detalle_id].activos++
                else if (t.estado === 'Asignado') counts[t.compra_detalle_id].asignados++
                else counts[t.compra_detalle_id].agotados++
                counts[t.compra_detalle_id].total++
            })
            setTonerCountsByDetalle(counts)
        } catch (error) {
            console.error('Error al cargar compras:', error.message)
        }
    }

    const handleAddMoreToCompra = (compra) => {
        setPrefillCompraId(compra?.id || '')
        setOpenDetalleDrawer(false)
        setOpenCompraDrawer(true)
    }

    const loadDetalleCompra = async (compra) => {
        if (!compra) return
        try {
            const { data, error } = await supabase
                .from('compra_detalles')
                .select('*, toners:bienes(*)')
                .eq('compra_id', compra.id)
            if (error) throw error
            setSelectedCompraToners(data || [])
        } catch (error) {
            console.error('Error al cargar tóneres:', error.message)
        }
    }

    const handleCompraClick = async (compra) => {
        setSelectedCompra(compra)
        await loadDetalleCompra(compra)
        setOpenDetalleDrawer(true)
    }

    const handleBatchUpdate = async () => {
        if (selectedCompra?.id) {
            const { data } = await supabase
                .from('compras_toners')
                .select('*, detalles:compra_detalles(*)')
                .eq('id', selectedCompra.id)
                .single()
            if (data) setSelectedCompra(data)
        }
        await Promise.all([
            cargarCompras(),
            loadDetalleCompra(selectedCompra)
        ])
    }

    const cargarComprasEquipos = async (term = '') => {
        try {
            let query = supabase
                .from('compras_equipos')
                .select('*, detalles:compras_equipos_detalles(*)')
                .order('fecha_compra', { ascending: false })
            if (term) {
                query = query.or(
                    `orden_compra.ilike.%${term}%,razon_social.ilike.%${term}%,ruc.ilike.%${term}%`
                )
            }
            const { data, error } = await query
            if (error) throw error
            setComprasEquipos(data || [])
        } catch (error) {
            console.error('Error al cargar compras de equipos:', error.message)
        }
    }

    const cargarBienesSinOC = async () => {
        try {
            const { data, error } = await supabase
                .from('bienes')
                .select('*')
                .is('compra_equipo_detalle_id', null)
                .is('compra_detalle_id', null)
                .order('tipo_equipo', { ascending: true })
            if (error) throw error
            setBienesSinOC(data || [])
        } catch (error) {
            console.error('Error al cargar bienes sin OC:', error.message)
        }
    }

    const handleAddMoreToCompraEquipo = (compra) => {
        setPrefillCompraEquipoId(compra?.id || '')
        setOpenDetalleEquipoDrawer(false)
        setOpenCompraEquipoDrawer(true)
    }

    const loadDetalleCompraEquipo = async (compra) => {
        if (!compra) return
        try {
            const { data, error } = await supabase
                .from('compras_equipos_detalles')
                .select('*, equipos:bienes!compra_equipo_detalle_id(*)')
                .eq('compra_id', compra.id)
            if (error) throw error
            setSelectedCompraEquipos(data || [])
        } catch (error) {
            console.error('Error al cargar equipos:', error.message)
        }
    }

    const handleCompraEquipoClick = async (compra) => {
        setSelectedCompraEquipo(compra)
        await loadDetalleCompraEquipo(compra)
        setOpenDetalleEquipoDrawer(true)
    }

    const handleBatchUpdateEquipo = async () => {
        if (selectedCompraEquipo?.id) {
            const { data } = await supabase
                .from('compras_equipos')
                .select('*, detalles:compras_equipos_detalles(*)')
                .eq('id', selectedCompraEquipo.id)
                .single()
            if (data) setSelectedCompraEquipo(data)
        }
        await Promise.all([
            cargarComprasEquipos(),
            loadDetalleCompraEquipo(selectedCompraEquipo)
        ])
    }

    const handleRegistrarCompraEquipo = async ({ compraForm, detalles, compraMode, selectedExistingCompra }) => {
        if (!compraForm.orden_compra) {
            mostrarToast('La orden de compra es obligatoria', 'error')
            throw new Error('Validation failed')
        }
        if (detalles.length === 0 || detalles.every(d => !d.serie)) {
            mostrarToast('Agrega al menos un equipo con número de serie', 'error')
            throw new Error('Validation failed')
        }

        try {
            setLoading(true)

            let compra
            if (compraMode === 'existente' && selectedExistingCompra) {
                const { data: existing } = await supabase
                    .from('compras_equipos')
                    .select('*')
                    .eq('id', selectedExistingCompra)
                    .single()
                compra = existing
            } else {
                const { data: newCompra, error: errCompra } = await supabase
                    .from('compras_equipos')
                    .insert([{
                        orden_compra: compraForm.orden_compra,
                        razon_social: compraForm.razon_social || null,
                        ruc: compraForm.ruc || null,
                        direccion: compraForm.direccion || null,
                        mes_calendario: compraForm.mes_calendario || null,
                        fecha_compra: compraForm.fecha_compra,
                        observaciones: compraForm.observaciones
                    }])
                    .select()
                    .single()
                if (errCompra) throw errCompra
                compra = newCompra
            }

            let totalCreados = 0
            for (const detalle of detalles) {
                const { data: detalleCreado, error: errDet } = await supabase
                    .from('compras_equipos_detalles')
                    .insert([{
                        compra_id: compra.id,
                        tipo_equipo: detalle.tipo_equipo,
                        marca_id: detalle.marca_id || null,
                        modelo_id: detalle.modelo_id || null,
                        marca: detalle.marca,
                        modelo: detalle.modelo,
                        serie: detalle.serie,
                        codigo_patrimonial: detalle.codigo_patrimonial || null,
                        cantidad_recibida: 1,
                        costo_unitario: safeParseFloat(detalle.costo_unitario),
                        procesador: detalle.procesador || null,
                        ram: detalle.ram || null,
                        almacenamiento: detalle.almacenamiento || null,
                        tipo_almacenamiento: detalle.tipo_almacenamiento || null,
                        sistema_operativo: detalle.sistema_operativo || null,
                        tamano_pantalla: detalle.tamano_pantalla || null,
                        direccion_mac: detalle.direccion_mac || null,
                        condicion: detalle.condicion || 'Bueno',
                        other: detalle.other || null
                    }])
                    .select()
                    .single()

                if (errDet) throw errDet

                const estado = determinarEstado(detalle.tipo_equipo, detalle.condicion)
                const { error: errBien } = await supabase
                    .from('bienes')
                    .insert([{
                        tipo_equipo: detalle.tipo_equipo,
                        marca_id: detalle.marca_id || null,
                        modelo_id: detalle.modelo_id || null,
                        marca: detalle.marca,
                        modelo: detalle.modelo,
                        serie: detalle.serie,
                        codigo_patrimonial: detalle.codigo_patrimonial || null,
                        orden_compra: compraForm.orden_compra,
                        compra_equipo_detalle_id: detalleCreado.id,
                        estado,
                        condicion: detalle.condicion || 'Bueno',
                        valor_compra: safeParseFloat(detalle.costo_unitario),
                        procesador: detalle.procesador || null,
                        ram: detalle.ram || null,
                        almacenamiento: detalle.almacenamiento || null,
                        tipo_almacenamiento: detalle.tipo_almacenamiento || null,
                        sistema_operativo: detalle.sistema_operativo || null,
                        tamano_pantalla: detalle.tamano_pantalla || null,
                        direccion_mac: detalle.direccion_mac || null,
                        other: compraForm.observaciones || detalle.other || ''
                    }])

                if (errBien) throw errBien
                totalCreados++
            }

            mostrarToast(`✅ ${totalCreados} equipo(s) agregados a O/C ${compraForm.orden_compra}`)
            loadStats(true).catch(() => {})
            cargarBienesPorCategoria(activeTab, true).catch(() => {})
            cargarComprasEquipos(searchTerm).catch(() => {})
        } catch (error) {
            if (error.message === 'Validation failed') throw error
            mostrarToast(handleApiError(error, 'registrar compra de equipos'), 'error')
            throw error
        } finally {
            setLoading(false)
        }
    }

    const handleImportarExcelBienes = async (rows) => {
        let totalCreados = 0
        let conOC = 0
        let sinOC = 0
        let codigosDuplicados = 0
        const errors = []

        // Deduplicar codigos patrimoniales y series contra BD
        const codigosUsados = new Set()
        const { data: seriesExistentes } = await supabase
            .from('bienes')
            .select('serie')
            .not('serie', 'is', null)
        const seriesEnBD = new Set((seriesExistentes || []).map(s => s.serie.toLowerCase()))
        const { data: codigosExistentes } = await supabase
            .from('bienes')
            .select('codigo_patrimonial')
            .not('codigo_patrimonial', 'is', null)
        const existentes = new Set((codigosExistentes || []).map(c => c.codigo_patrimonial))
        for (const row of rows) {
            const cp = String(row.codigo_patrimonial || '').trim()
            if (cp) {
                if (codigosUsados.has(cp) || existentes.has(cp)) {
                    row.codigo_patrimonial = ''
                    codigosDuplicados++
                } else {
                    codigosUsados.add(cp)
                }
            }
        }

        // Verificar series contra BD y dentro del Excel
        const seriesEnImport = new Set()
        for (const row of rows) {
            const s = String(row.serie || '').trim().toLowerCase()
            if (s) {
                if (seriesEnBD.has(s) || seriesEnImport.has(s)) {
                    errors.push(`Serie ${row.serie}: ya existe en la base de datos`)
                    row._skip = true
                } else {
                    seriesEnImport.add(s)
                }
            }
        }

        const grouped = {}
        for (const row of rows) {
            const oc = String(row.orden_compra || '').trim()
            if (!grouped[oc]) grouped[oc] = []
            grouped[oc].push(row)
        }

        for (const [oc, grupo] of Object.entries(grouped)) {
            if (oc) {
                let compra
                const { data: existing } = await supabase
                    .from('compras_equipos')
                    .select('id')
                    .eq('orden_compra', oc)
                    .maybeSingle()
                if (existing) {
                    compra = existing
                    // Limpiar detalles huérfanos de intentos anteriores (sin bien asociado)
                    const { data: dets } = await supabase
                        .from('compras_equipos_detalles')
                        .select('id')
                        .eq('compra_id', compra.id)
                    if (dets && dets.length > 0) {
                        const detIds = dets.map(d => d.id)
                        const { data: bienesConDet } = await supabase
                            .from('bienes')
                            .select('compra_equipo_detalle_id')
                            .in('compra_equipo_detalle_id', detIds)
                        const idsConBien = new Set((bienesConDet || []).map(b => b.compra_equipo_detalle_id))
                        const idsHuérfanos = detIds.filter(id => !idsConBien.has(id))
                        if (idsHuérfanos.length > 0) {
                            await supabase
                                .from('compras_equipos_detalles')
                                .delete()
                                .in('id', idsHuérfanos)
                        }
                    }
                } else {
                    const first = grupo[0]
                    const { data: newCompra, error: errCompra } = await supabase
                        .from('compras_equipos')
                        .insert([{
                            orden_compra: oc,
                            razon_social: String(first.razon_social || '').trim() || null,
                            ruc: String(first.ruc || '').trim() || null,
                            direccion: String(first.direccion || '').trim() || null,
                            mes_calendario: String(first.mes_calendario || '').trim() || null,
                            fecha_compra: first.fecha_compra || null,
                            observaciones: first.other || null
                        }])
                        .select()
                        .single()
                    if (errCompra) { errors.push(`OC ${oc}: ${errCompra.message}`); continue }
                    compra = newCompra
                }

                for (const row of grupo) {
                    if (row._skip) continue
                    try {
                        const tipoEquipo = String(row.tipo_equipo || 'Otro').trim()
                        let marcaId = null
                        let modeloId = null
                        const marcaStr = String(row.marca || '').trim()
                        if (marcaStr) marcaId = await findOrCreateMarca(marcaStr)
                        const modeloStr = String(row.modelo || '').trim()
                        if (modeloStr && marcaId) modeloId = await findOrCreateModelo(modeloStr, marcaId)

                        const serieValue = String(row.serie || '').trim() || generarSerieUnica()

                        const { data: detalle, error: errDet } = await supabase
                            .from('compras_equipos_detalles')
                            .insert([{
                                compra_id: compra.id,
                                tipo_equipo: tipoEquipo,
                                marca_id: marcaId,
                                modelo_id: modeloId,
                                marca: marcaStr,
                                modelo: modeloStr,
                                serie: serieValue,
                                codigo_patrimonial: String(row.codigo_patrimonial || '').trim() || null,
                                cantidad_recibida: 1,
                                costo_unitario: safeParseFloat(row.costo_unitario),
                                procesador: String(row.procesador || '').trim() || null,
                                ram: String(row.ram || '').trim() || null,
                                almacenamiento: String(row.almacenamiento || '').trim() || null,
                                tipo_almacenamiento: String(row.tipo_almacenamiento || '').trim() || null,
                                sistema_operativo: String(row.sistema_operativo || '').trim() || null,
                                tamano_pantalla: String(row.tamano_pantalla || '').trim() || null,
                                direccion_mac: String(row.direccion_mac || '').trim() || null,
                                condicion: String(row.condicion || 'Bueno').trim(),
                                other: String(row.other || '').trim() || null
                            }])
                            .select()
                            .single()
                        if (errDet) { errors.push(`Serie ${row.serie}: ${errDet.message}`); continue }

                        const estado = determinarEstado(tipoEquipo, row.condicion)
                        const { error: errBien } = await supabase
                            .from('bienes')
                            .insert([{
                                tipo_equipo: tipoEquipo,
                                marca_id: marcaId,
                                modelo_id: modeloId,
                                marca: marcaStr,
                                modelo: modeloStr,
                                serie: serieValue,
                                codigo_patrimonial: String(row.codigo_patrimonial || '').trim() || null,
                                orden_compra: oc,
                                compra_equipo_detalle_id: detalle.id,
                                estado,
                                condicion: String(row.condicion || 'Bueno').trim(),
                                valor_compra: safeParseFloat(row.costo_unitario),
                                color: String(row.color || '').trim() || null,
                                procesador: String(row.procesador || '').trim() || null,
                                ram: String(row.ram || '').trim() || null,
                                almacenamiento: String(row.almacenamiento || '').trim() || null,
                                tipo_almacenamiento: String(row.tipo_almacenamiento || '').trim() || null,
                                sistema_operativo: String(row.sistema_operativo || '').trim() || null,
                                tamano_pantalla: String(row.tamano_pantalla || '').trim() || null,
                                direccion_mac: String(row.direccion_mac || '').trim() || null,
                                other: String(row.other || '').trim() || null
                            }])
                        if (errBien) { errors.push(`Bien ${row.serie}: ${errBien.message}`); continue }
                        totalCreados++
                        conOC++
                    } catch (e) {
                        errors.push(`${row.serie || '?'}: ${e.message}`)
                    }
                }
            } else {
                for (const row of grupo) {
                    if (row._skip) continue
                    try {
                        const tipoEquipo = String(row.tipo_equipo || 'Otro').trim()
                        let marcaId = null
                        let modeloId = null
                        const marcaStr = String(row.marca || '').trim()
                        if (marcaStr) marcaId = await findOrCreateMarca(marcaStr)
                        const modeloStr = String(row.modelo || '').trim()
                        if (modeloStr && marcaId) modeloId = await findOrCreateModelo(modeloStr, marcaId)

                        const estado = determinarEstado(tipoEquipo, row.condicion)
                        const { error: errBien } = await supabase
                            .from('bienes')
                            .insert([{
                                tipo_equipo: tipoEquipo,
                                marca_id: marcaId,
                                modelo_id: modeloId,
                                marca: marcaStr,
                                modelo: modeloStr,
                                serie: String(row.serie || '').trim() || generarSerieUnica(),
                                codigo_patrimonial: String(row.codigo_patrimonial || '').trim() || null,
                                estado,
                                condicion: String(row.condicion || 'Bueno').trim(),
                                valor_compra: safeParseFloat(row.costo_unitario),
                                color: String(row.color || '').trim() || null,
                                procesador: String(row.procesador || '').trim() || null,
                                ram: String(row.ram || '').trim() || null,
                                almacenamiento: String(row.almacenamiento || '').trim() || null,
                                tipo_almacenamiento: String(row.tipo_almacenamiento || '').trim() || null,
                                sistema_operativo: String(row.sistema_operativo || '').trim() || null,
                                tamano_pantalla: String(row.tamano_pantalla || '').trim() || null,
                                direccion_mac: String(row.direccion_mac || '').trim() || null,
                                other: String(row.other || '').trim() || null
                            }])
                        if (errBien) { errors.push(`Bien ${row.serie}: ${errBien.message}`); continue }
                        totalCreados++
                        sinOC++
                    } catch (e) {
                        errors.push(`${row.serie || '?'}: ${e.message}`)
                    }
                }
            }
        }

        loadStats(true).catch(() => {})
        cargarBienesPorCategoria(activeTab, true).catch(() => {})
        if (activeTab === 'equipos') {
            cargarComprasEquipos(searchTerm).catch(() => {})
            cargarBienesSinOC().catch(() => {})
        }

        return { success: errors.length === 0, count: totalCreados, conOC, sinOC, codigosDuplicados, errors }
    }

    const handleRegistrarCompra = async ({ compraForm, detalles, compraMode, selectedExistingCompra }) => {
        if (!compraForm.orden_compra) {
            mostrarToast('La orden de compra es obligatoria', 'error')
            throw new Error('Validation failed')
        }
        if (detalles.length === 0 || detalles.every(d => !d.marca && !d.marca_id)) {
            mostrarToast('Agrega al menos un detalle con marca', 'error')
            throw new Error('Validation failed')
        }

        try {
            setLoading(true)

            let compra
            if (compraMode === 'existente' && selectedExistingCompra) {
                const { data: existing } = await supabase
                    .from('compras_toners')
                    .select('*')
                    .eq('id', selectedExistingCompra)
                    .single()
                compra = existing
            } else {
                const { data: newCompra, error: errCompra } = await supabase
                    .from('compras_toners')
                    .insert([{
                        orden_compra: compraForm.orden_compra,
                        proveedor: compraForm.proveedor,
                        fecha_compra: compraForm.fecha_compra,
                        observaciones: compraForm.observaciones
                    }])
                    .select()
                    .single()
                if (errCompra) throw errCompra
                compra = newCompra
            }

            let totalCreados = 0
            for (const detalle of detalles) {
                const recibido = parseInt(detalle.cantidad_recibida) || 0
                if (recibido === 0) continue

                const { data: detalleCreado, error: errDet } = await supabase
                    .from('compra_detalles')
                    .insert([{
                        compra_id: compra.id,
                        marca_id: detalle.marca_id || null,
                        modelo_id: detalle.modelo_id || null,
                        marca: detalle.marca,
                        modelo: detalle.modelo,
                        color_toner: detalle.color_toner,
                        cantidad_pedida: parseInt(detalle.cantidad_pedida) || 0,
                        cantidad_recibida: recibido,
                        costo_unitario: safeParseFloat(detalle.costo_unitario),
                        lote: detalle.lote,
                        rendimiento: safeParseInt(detalle.rendimiento),
                        fecha_vencimiento: detalle.fecha_vencimiento || null
                    }])
                    .select()
                    .single()

                if (errDet) throw errDet

                const bienesData = []
                const now = Date.now()
                let seriesInput = []
                if (detalle.series_manual?.trim()) {
                    seriesInput = detalle.series_manual.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
                }
                const totalSeries = seriesInput.length > 0 ? seriesInput.length : recibido
                for (let i = 0; i < totalSeries; i++) {
                    const numSerie = String(i + 1).padStart(3, '0')
                    const serie = seriesInput.length > 0
                        ? seriesInput[i]
                        : detalle.lote
                            ? `${detalle.lote}-${numSerie}-${now}`
                            : `${compraForm.orden_compra.replace(/[/\s]/g, '-')}-${numSerie}-${now}`

                    bienesData.push({
                        tipo_equipo: 'Tóner',
                        marca_id: detalle.marca_id || null,
                        modelo_id: detalle.modelo_id || null,
                        marca: detalle.marca,
                        modelo: detalle.modelo,
                        color_toner: detalle.color_toner,
                        serie,
                        lote: detalle.lote,
                        rendimiento: safeParseInt(detalle.rendimiento),
                        orden_compra: compraForm.orden_compra,
                        proveedor: compraForm.proveedor,
                        compra_detalle_id: detalleCreado.id,
                        estado: 'Disponible',
                        condicion: 'Bueno',
                        valor_compra: safeParseFloat(detalle.costo_unitario),
                        ubicacion_almacen: detalle.ubicacion || '',
                        fecha_vencimiento: detalle.fecha_vencimiento || null,
                        other: compraForm.observaciones || ''
                    })
                }

                const { error: errBienes } = await supabase
                    .from('bienes')
                    .insert(bienesData)

                if (errBienes) throw errBienes
                totalCreados += totalSeries
            }

            mostrarToast(`✅ ${totalCreados} tóner(es) agregados a O/C ${compraForm.orden_compra}`)
            loadStats(true).catch(() => {})
            cargarBienesPorCategoria(activeTab, true).catch(() => {})
            cargarCompras(searchTerm).catch(() => {})
        } catch (error) {
            if (error.message === 'Validation failed') throw error
            mostrarToast(handleApiError(error, 'registrar compra'), 'error')
            throw error
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => {
            const next = { ...prev, [name]: value }
            if (name === 'tipo_equipo' && prev.tipo_equipo !== value) {
                const tiposComputo = ['CPU', 'Desktop', 'Laptop', 'All-in-One', 'Tablet']

                if (!editMode) {
                    next.serie = ''
                    next.marca = ''
                    next.marca_id = ''
                    next.modelo = ''
                    next.modelo_id = ''
                }

                if (!tiposComputo.includes(value)) {
                    next.procesador = ''
                    next.ram = ''
                    next.almacenamiento = ''
                    next.tipo_almacenamiento = ''
                    next.sistema_operativo = ''
                    next.direccion_mac = ''
                }
                if (value !== 'Monitor') {
                    next.tamano_pantalla = ''
                }
                if (value !== 'Tóner') {
                    next.color_toner = ''
                    next.rendimiento = ''
                    next.lote = ''
                    next.fecha_vencimiento = ''
                    next.proveedor = ''
                    next.ubicacion_almacen = ''
                }

                if (value === 'Tóner') {
                    next.color = null
                    if (!editMode) {
                        next.condicion = 'Bueno'
                        next.estado = 'Disponible'
                    }
                } else if (prev.tipo_equipo === 'Tóner') {
                    next.color = ''
                    if (!editMode) next.estado = 'Activo'
                }
            }
            if (name === 'marca_id') {
                const marca = marcas.find(m => String(m.id) === value)
                next.marca = marca?.nombre || (next.marca || '')
                next.modelo_id = ''
                next.modelo = ''
            }
            if (name === 'modelo_id') {
                const modelo = modelos.find(m => String(m.id) === value)
                next.modelo = modelo?.nombre || (next.modelo || '')
            }
            if (name === 'marca') {
                const clean = String(value).trim()
                const match = marcas.find(m => m.nombre.toLowerCase() === clean.toLowerCase())
                if (match) {
                    next.marca_id = String(match.id)
                    next.modelo_id = ''
                    next.modelo = ''
                } else {
                    next.marca_id = ''
                }
            }
            if (name === 'modelo') {
                const clean = String(value).trim()
                const match = modelos.find(m => String(m.marca_id) === String(prev.marca_id) && m.nombre.toLowerCase() === clean.toLowerCase())
                if (match) {
                    next.modelo_id = String(match.id)
                } else {
                    next.modelo_id = ''
                }
            }
            if (name === 'condicion' && prev.tipo_equipo !== 'Tóner') {
                if (value === 'Malo' && prev.estado === 'Activo') {
                    next.estado = 'Inactivo'
                } else if (value === 'Chatarra') {
                    next.estado = 'Dado de Baja'
                }
            }
            return next
        })
        if (name === 'marca_id') {
            const filtrados = modelos.filter(m => String(m.marca_id) === value)
            setModelosFiltrados(filtrados)
        }
        if (name === 'marca') {
            const clean = String(value).trim()
            const match = marcas.find(m => m.nombre.toLowerCase() === clean.toLowerCase())
            if (match) {
                const filtrados = modelos.filter(m => m.marca_id === match.id)
                setModelosFiltrados(filtrados)
            } else {
                setModelosFiltrados([])
            }
        }

    if (name === 'tipo_equipo') {
        if (!editMode) {
            setModelosFiltrados([])
        }
        setMonitoresDetectados([])
        setMonitorSeleccionadoIndex(null)
        const tiposComputo = ['CPU', 'Desktop', 'Laptop', 'All-in-One', 'Tablet']
        if (!editMode) {
            if (tiposComputo.includes(value)) {
                intentarAutoDetectar()
            } else if (value === 'Monitor') {
                intentarAutoDetectarMonitor()
            }
        }
    }
    }

    const intentarAutoDetectar = async () => {
        try {
            const res = await fetchAgentito('/api/info')
            if (!res) {
                mostrarToast('Agentito no disponible — verifica que agentito.exe esté ejecutándose', 'error')
                return
            }
            const data = await res.json()

            const marcaDetectada = (data.marca || '').trim()
            const match = marcas.find(m => m.nombre.toLowerCase() === marcaDetectada.toLowerCase())
            const marcaId = match ? match.id : ''
            const modeloDetectado = (data.modelo || '').trim()
            let modeloId = ''
            if (match) {
                const modelosDeMarca = modelos.filter(m => m.marca_id === match.id)
                const modeloMatch = modelosDeMarca.find(m => m.nombre.toLowerCase() === modeloDetectado.toLowerCase())
                if (modeloMatch) {
                    modeloId = modeloMatch.id
                }
            }

            setFormData(prev => ({
                ...prev,
                serie: data.numero_serie || '',
                marca: marcaDetectada,
                marca_id: marcaId,
                modelo: modeloDetectado,
                modelo_id: modeloId,
                procesador: data.procesador || '',
                ram: data.ram || '',
                almacenamiento: data.almacenamiento || '',
                tipo_almacenamiento: data.tipo_almacenamiento || '',
                sistema_operativo: data.sistema_operativo || '',
                direccion_mac: data.direccion_mac || '',
            }))

            if (match) {
                const filtrados = modelos.filter(m => m.marca_id === match.id)
                setModelosFiltrados(filtrados)
            }

            mostrarToast('Datos del equipo detectados ✅', 'success')
        } catch {
            mostrarToast('Error al leer datos del agentito — intenta de nuevo', 'error')
        }
    }

    const aplicarMonitor = (monitor) => {
        const marcaDetectada = (monitor.marca || '').trim()
        const match = marcas.find(m => m.nombre.toLowerCase() === marcaDetectada.toLowerCase())
        const marcaId = match ? match.id : ''
        const modeloDetectado = (monitor.modelo || '').trim()
        let modeloId = ''
        if (match) {
            const modelosDeMarca = modelos.filter(m => m.marca_id === match.id)
            const modeloMatch = modelosDeMarca.find(m => m.nombre.toLowerCase() === modeloDetectado.toLowerCase())
            if (modeloMatch) {
                modeloId = modeloMatch.id
            }
        }

        setFormData(prev => ({
            ...prev,
            marca: marcaDetectada,
            marca_id: marcaId,
            modelo: modeloDetectado,
            modelo_id: modeloId,
            serie: monitor.serie || '',
            tamano_pantalla: monitor.tamano_pantalla || '',
        }))

        if (match) {
            const filtrados = modelos.filter(m => m.marca_id === match.id)
            setModelosFiltrados(filtrados)
        }
    }

    const intentarAutoDetectarMonitor = async () => {
        try {
            const res = await fetchAgentito('/api/monitor')
            if (!res) {
                mostrarToast('Agentito no disponible — verifica que agentito.exe esté ejecutándose', 'error')
                return
            }
            const data = await res.json()

            if (!Array.isArray(data) || data.length === 0) {
                mostrarToast('No se detectaron monitores conectados', 'error')
                return
            }

            setMonitoresDetectados(data)
            setMonitorSeleccionadoIndex(0)
            aplicarMonitor(data[0])

            if (data.length > 1) {
                mostrarToast('Se detectaron ' + data.length + ' monitores — selecciona cuál usar abajo', 'success')
            } else {
                mostrarToast('Monitor detectado ✅', 'success')
            }
        } catch {
            mostrarToast('Error al leer datos del agentito — intenta de nuevo', 'error')
        }
    }

    const seleccionarMonitor = (index) => {
        const monitor = monitoresDetectados[index]
        if (!monitor) return
        setMonitorSeleccionadoIndex(index)
        aplicarMonitor(monitor)
    }

    function normalizeName(str) {
      if (!str) return ''
      const cleaned = str.trim().replace(/\s+/g, ' ')
      if (!cleaned) return ''
      if (cleaned === cleaned.toLowerCase()) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      }
      return cleaned
    }

    async function findOrCreateMarca(name) {
      if (!name) return null
      const normalized = normalizeName(name)
      if (!normalized) return null

      const existing = marcas.find(m => m.nombre.toLowerCase() === normalized.toLowerCase())
      if (existing) return existing.id

      const { data: existingDb } = await supabase
        .from('marcas')
        .select('id')
        .ilike('nombre', normalized)
        .maybeSingle()
      if (existingDb) return existingDb.id

      const { data: created, error } = await supabase
        .from('marcas')
        .insert([{ nombre: normalized }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          const { data: retry } = await supabase
            .from('marcas')
            .select('id')
            .ilike('nombre', normalized)
            .single()
          return retry?.id || null
        }
        throw error
      }

      setMarcas(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      return created.id
    }

    async function findOrCreateModelo(name, marcaId) {
      if (!name || !marcaId) return null
      const normalized = normalizeName(name)
      if (!normalized) return null

      const existing = modelos.find(m => m.nombre.toLowerCase() === normalized.toLowerCase() && String(m.marca_id) === String(marcaId))
      if (existing) return existing.id

      const { data: existingDb } = await supabase
        .from('modelos')
        .select('id')
        .eq('marca_id', marcaId)
        .ilike('nombre', normalized)
        .maybeSingle()
      if (existingDb) return existingDb.id

      const { data: created, error } = await supabase
        .from('modelos')
        .insert([{ nombre: normalized, marca_id: marcaId }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          const { data: retry } = await supabase
            .from('modelos')
            .select('id')
            .eq('marca_id', marcaId)
            .ilike('nombre', normalized)
            .single()
          return retry?.id || null
        }
        throw error
      }

      setModelos(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      return created.id
    }

    const handleSubmit = async () => {
        if (!formData.tipo_equipo) {
            mostrarToast('El tipo de equipo es obligatorio', 'error')
            return
        }

        try {
            if (formData.codigo_patrimonial) {
                let query = supabase
                    .from('bienes')
                    .select('id', { count: 'exact', head: true })
                    .eq('codigo_patrimonial', formData.codigo_patrimonial)
                if (editMode && selectedBien?.id) {
                    query = query.neq('id', selectedBien.id)
                }
                const { count } = await query
                if (count > 0) {
                    mostrarToast('El código patrimonial ya está registrado para otro bien', 'error')
                    return
                }
            }

            let marcaId = formData.marca_id
            if (formData.marca && (!marcaId || !marcas.some(m => String(m.id) === marcaId))) {
                marcaId = await findOrCreateMarca(formData.marca)
            }

            let modeloId = formData.modelo_id
            if (formData.modelo && marcaId && (!modeloId || !modelos.some(m => String(m.id) === modeloId))) {
                modeloId = await findOrCreateModelo(formData.modelo, marcaId)
            }

            let serie = formData.serie?.trim()
            if (!serie) {
                serie = generarSerieUnica()
                setFormData(prev => ({ ...prev, serie }))
                mostrarToast(`Serie auto-generada: ${serie}`, 'success')
            }

            const safeFields = [
                'tipo_equipo', 'marca', 'modelo', 'marca_id', 'modelo_id',
                'serie', 'codigo_patrimonial', 'codigo_ti', 'anio_compra',
                'orden_compra', 'condicion', 'valor_compra', 'estado',
                'color_toner', 'color', 'rendimiento', 'lote',
                'fecha_vencimiento', 'proveedor', 'ubicacion_almacen', 'other',
                'procesador', 'ram', 'almacenamiento', 'tipo_almacenamiento',
                'sistema_operativo', 'direccion_mac', 'tamano_pantalla'
            ]
            const sanitized = {}
            safeFields.forEach(k => {
                const val = formData[k]
                if (k === 'marca_id' || k === 'modelo_id') {
                    sanitized[k] = val || null
                } else {
                    sanitized[k] = val
                }
            })
            sanitized.marca_id = marcaId
            sanitized.modelo_id = modeloId
            sanitized.serie = serie
            const nullableFields = ['fecha_vencimiento', 'valor_compra', 'rendimiento', 'anio_compra', 'codigo_ti', 'color', 'codigo_patrimonial',
                'procesador', 'ram', 'almacenamiento', 'tipo_almacenamiento', 'sistema_operativo', 'direccion_mac', 'tamano_pantalla']
            nullableFields.forEach(f => {
                if (sanitized[f] === '') sanitized[f] = null
            })

            if (sanitized.tipo_equipo !== 'Tóner') {
                if (sanitized.condicion === 'Malo' && sanitized.estado === 'Activo') {
                    sanitized.estado = 'Inactivo'
                } else if (sanitized.condicion === 'Chatarra') {
                    sanitized.estado = 'Dado de Baja'
                }
            }

            if (editMode) {
                if (!selectedBien?.id) {
                    mostrarToast('Error: bien no encontrado para editar', 'error')
                    return
                }
                const { error } = await supabase
                    .from('bienes')
                    .update(sanitized)
                    .eq('id', selectedBien.id)

                if (error) throw error
                mostrarToast('Bien actualizado correctamente')
            } else {
                const { error } = await supabase
                    .from('bienes')
                    .insert([sanitized])

                if (error) throw error
                mostrarToast('Bien registrado correctamente')
            }

            setOpenDrawer(false)
            resetForm()
            cargarCatalogo(true).catch(() => {})
            loadStats(true).catch(() => {})
            cargarBienesPorCategoria(activeTab, true).catch(() => {})
        } catch (error) {
            mostrarToast(handleApiError(error, 'guardar bien'), 'error')
        }
    }

    const handleEdit = (bien) => {
        setEditMode(true)
        setSelectedBien(bien)
        setMonitoresDetectados([])
        setMonitorSeleccionadoIndex(null)
        setFormData({
            tipo_equipo: bien.tipo_equipo || '',
            marca: bien.marca || '',
            modelo: bien.modelo || '',
            marca_id: bien.marca_id || '',
            modelo_id: bien.modelo_id || '',
            color: bien.color || '',
            other: bien.other || '',
            codigo_ti: bien.codigo_ti || '',
            codigo_patrimonial: bien.codigo_patrimonial || '',
            serie: bien.serie || '',
            anio_compra: bien.anio_compra ?? new Date().getFullYear(),
            orden_compra: bien.orden_compra ?? '',
            condicion: bien.condicion ?? 'Bueno',
            valor_compra: bien.valor_compra ?? '',
            estado: bien.estado ?? 'Activo',
            color_toner: bien.color_toner ?? '',
            rendimiento: bien.rendimiento ?? '',
            lote: bien.lote || '',
            fecha_vencimiento: bien.fecha_vencimiento || '',
            proveedor: bien.proveedor || '',
            ubicacion_almacen: bien.ubicacion_almacen || '',
            procesador: bien.procesador || '',
            ram: bien.ram || '',
            almacenamiento: bien.almacenamiento || '',
            tipo_almacenamiento: bien.tipo_almacenamiento || '',
            sistema_operativo: bien.sistema_operativo || '',
            direccion_mac: bien.direccion_mac || '',
            tamano_pantalla: bien.tamano_pantalla || ''
        })
        if (bien.marca_id) {
            const filtrados = modelos.filter(m => m.marca_id === bien.marca_id)
            setModelosFiltrados(filtrados)
        } else if (bien.marca) {
        }
        setOpenDrawer(true)
    }

    const handleDelete = (bien) => {
        setDeleteTarget(bien)
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        try {
            const [asigCount, tonerCount] = await Promise.all([
                supabase
                    .from('asignaciones')
                    .select('id', { count: 'exact', head: true })
                    .eq('bien_id', deleteTarget.id)
                    .limit(1),
                supabase
                    .from('asignacion_toners')
                    .select('id', { count: 'exact', head: true })
                    .eq('toner_id', deleteTarget.id)
                    .limit(1)
            ])

            if ((asigCount.count || 0) > 0) {
                mostrarToast('No se puede eliminar porque el bien tiene asignaciones registradas', 'error')
                return
            }
            if ((tonerCount.count || 0) > 0) {
                mostrarToast('No se puede eliminar porque el tóner tiene asignaciones registradas', 'error')
                return
            }

            const { error } = await supabase
                .from('bienes')
                .delete()
                .eq('id', deleteTarget.id)

            if (error) throw error
            mostrarToast('Bien eliminado correctamente')
            loadStats(true).catch(() => {})
            cargarBienesPorCategoria(activeTab, true).catch(() => {})
        } catch (error) {
            mostrarToast(handleApiError(error, 'eliminar bien'), 'error')
        } finally {
            setDeleteTarget(null)
        }
    }

    const resetForm = () => {
        setEditMode(false)
        setSelectedBien(null)
        setModelosFiltrados([])
        setMonitoresDetectados([])
        setMonitorSeleccionadoIndex(null)
        setFormData({ ...emptyForm })
    }

    const filteredBienes = bienes.filter(bien => {
        if (!bien) return false
        const matchesSearch =
            bien.tipo_equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(bien.codigo_patrimonial ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (bien.codigo_ti || '').toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        if (activeTab === 'estaciones') {
            return true
        } else if (activeTab === 'computo') {
            return categorias.computo.includes(bien.tipo_equipo)
        } else if (activeTab === 'impresoras') {
            return categorias.impresoras.includes(bien.tipo_equipo)
        } else if (activeTab === 'perifericos') {
            return categorias.perifericos.includes(bien.tipo_equipo)
        } else if (activeTab === 'otros') {
            const todosTipos = [...categorias.computo, ...categorias.impresoras, ...categorias.perifericos, ...categorias.consumibles]
            return !todosTipos.includes(bien.tipo_equipo) && bien.tipo_equipo !== ''
        }

        return true
    }).filter(bien => {
        if (filtroOC === 'todos') return true
        const tieneOC = bien.compra_equipo_detalle_id || bien.compra_detalle_id || (bien.orden_compra && bien.orden_compra.trim())
        return filtroOC === 'conOC' ? !!tieneOC : !tieneOC
    })

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, activeTab, filtroOC])

    const totalPages = Math.max(1, Math.ceil(filteredBienes.length / PAGE_SIZE))

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages)
    }, [filteredBienes.length])

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredBienes.slice(start, start + PAGE_SIZE)
    }, [filteredBienes, currentPage])

    const stats = {
        total: statsLight.length,
        computo: statsLight.filter(b => categorias.computo.includes(b.tipo_equipo)).length,
        impresoras: statsLight.filter(b => categorias.impresoras.includes(b.tipo_equipo)).length,
        perifericos: statsLight.filter(b => categorias.perifericos.includes(b.tipo_equipo)).length,
        consumibles: statsLight.filter(b => categorias.consumibles.includes(b.tipo_equipo)).length,
        activos: statsLight.filter(b => b.estado === 'Activo').length
    }

    const exportarAExcel = async () => {
        try {
            setExportando(true)
            const { utils, writeFile } = await import('xlsx')
            const datosExportar = filteredBienes.map(bien => ({
                'Tipo de Equipo': bien.tipo_equipo || '',
                'Marca': bien.marca || '',
                'Modelo': bien.modelo || '',
                'Código Patrimonial': bien.codigo_patrimonial || '',
                'Código TI': bien.codigo_ti || '',
                'Serie': bien.serie || '',
                'Condición': bien.condicion || '',
                'Estado': bien.estado || '',
                'Año Compra': bien.anio_compra || '',
                'Valor Compra': bien.valor_compra || '',
                'Orden Compra': bien.orden_compra || '',
                'Color': bien.color || '',
                'Procesador': bien.procesador || '',
                'RAM': bien.ram || '',
                'Almacenamiento': bien.almacenamiento || '',
                'Tipo Almacenamiento': bien.tipo_almacenamiento || '',
                'Sistema Operativo': bien.sistema_operativo || '',
                'Dirección MAC': bien.direccion_mac || '',
                'Tamaño Pantalla': bien.tamano_pantalla || '',
                'Color Tóner': bien.color_toner || '',
                'Rendimiento': bien.rendimiento || '',
                'Lote': bien.lote || '',
                'Fecha Vencimiento': bien.fecha_vencimiento || '',
                'Proveedor': bien.proveedor || '',
                'Ubicación Almacén': bien.ubicacion_almacen || '',
                'Observaciones': bien.other || ''
            }))

            const ws = utils.json_to_sheet(datosExportar)
            ws['!cols'] = [
                { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 20 },
                { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
                { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 12 },
                { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 18 },
                { wch: 22 }, { wch: 20 }, { wch: 14 }, { wch: 14 },
                { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 20 },
                { wch: 30 }
            ]

            const wb = utils.book_new()
            utils.book_append_sheet(wb, ws, 'Bienes')
            writeFile(wb, `bienes_${new Date().toISOString().split('T')[0]}.xlsx`)

            mostrarToast('Exportación completada ✅', 'success')
        } catch (error) {
            mostrarToast(handleApiError(error, 'exportar datos'), 'error')
        } finally {
            setExportando(false)
        }
    }

    return {
        bienes, loading, searchTerm, setSearchTerm,
        openDrawer, setOpenDrawer,
        editMode, selectedBien,
        activeTab, setActiveTab,
        marcas, modelos, modelosFiltrados,
        comprasAgrupadas, openDetalleDrawer, setOpenDetalleDrawer,
        openCompraDrawer, setOpenCompraDrawer,
        selectedCompra, setSelectedCompra,
        selectedCompraToners, setSelectedCompraToners,
        prefillCompraId, setPrefillCompraId,
        ambientes,
        formData, setFormData,
        tonerCountsByDetalle, categorias,
        filteredBienes, paginatedData, stats, filtroOC, setFiltroOC,
        currentPage, setCurrentPage, totalPages, PAGE_SIZE,
        cargarBienes: cargarBienesPorCategoria, cargarCompras, cargarComprasEquipos, cargarBienesSinOC, cargarCatalogo, loadStats,
        handleAddMoreToCompra, handleCompraClick, handleBatchUpdate,
        handleRegistrarCompra,
        comprasEquipos,
        openDetalleEquipoDrawer, setOpenDetalleEquipoDrawer,
        openCompraEquipoDrawer, setOpenCompraEquipoDrawer,
        selectedCompraEquipo, setSelectedCompraEquipo,
        selectedCompraEquipos, setSelectedCompraEquipos,
        prefillCompraEquipoId, setPrefillCompraEquipoId,
        openImportarExcelDrawer, setOpenImportarExcelDrawer,
        bienesSinOC,
        handleCompraEquipoClick, handleAddMoreToCompraEquipo, handleBatchUpdateEquipo,
        handleRegistrarCompraEquipo,
        handleImportarExcelBienes,
        handleInputChange, handleSubmit, handleEdit, handleDelete, confirmDelete,
        deleteTarget, setDeleteTarget,
        diagnostico, diagnosticar,
        intentarAutoDetectarMonitor,
        monitoresDetectados, monitorSeleccionadoIndex, seleccionarMonitor,
        resetForm,
        exportando, exportarAExcel,
        mostrarToast
    }
}

export default useBienes
