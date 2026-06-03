import { useEffect, useState } from 'react'
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
    ubicacion_almacen: ''
}

const useBienes = () => {
    const [bienes, setBienes] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [openDrawer, setOpenDrawer] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedBien, setSelectedBien] = useState(null)
    const [activeTab, setActiveTab] = useState('computo')

    const [marcas, setMarcas] = useState([])
    const [modelos, setModelos] = useState([])
    const [modelosFiltrados, setModelosFiltrados] = useState([])
    const [marcaManual, setMarcaManual] = useState(false)

    const [comprasAgrupadas, setComprasAgrupadas] = useState([])
    const [openDetalleDrawer, setOpenDetalleDrawer] = useState(false)
    const [openCompraDrawer, setOpenCompraDrawer] = useState(false)
    const [selectedCompra, setSelectedCompra] = useState(null)
    const [selectedCompraToners, setSelectedCompraToners] = useState([])
    const [prefillCompraId, setPrefillCompraId] = useState('')

    const [ambientes, setAmbientes] = useState([])

    const [formData, setFormData] = useState({ ...emptyForm })

    const { dispatchToast } = useToastController()

    const [tonerCountsByDetalle, setTonerCountsByDetalle] = useState({})
    const [deleteTarget, setDeleteTarget] = useState(null)

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
        cargarBienesPorCategoria(activeTab)
    }, [])

    useEffect(() => {
        if (activeTab === 'consumibles') {
            setBienes([])
            cargarCompras(searchTerm)
        } else {
            cargarBienesPorCategoria(activeTab)
        }
    }, [activeTab])

    useEffect(() => {
        if (activeTab === 'consumibles') {
            cargarCompras(searchTerm)
        }
    }, [searchTerm])

    const mostrarToast = (mensaje, tipo = 'success') => {
        dispatchToast(
            <Toast>
                <ToastTitle>{tipo === 'success' ? '✅ Éxito' : '❌ Error'}</ToastTitle>
                <ToastBody>{mensaje}</ToastBody>
            </Toast>,
            { intent: tipo }
        )
    }

    const cargarBienesPorCategoria = async (tab) => {
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
            setBienes(data || [])
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar bienes'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const cargarCatalogo = async () => {
        try {
            const [marcasRes, modelosRes, ambientesRes] = await Promise.all([
                supabase.from('marcas').select('*').order('nombre'),
                supabase.from('modelos').select('*').order('nombre'),
                supabase.from('ambientes').select('*').order('nombre')
            ])
            if (marcasRes.error) throw marcasRes.error
            if (modelosRes.error) throw modelosRes.error
            setMarcas(marcasRes.data || [])
            setModelos(modelosRes.data || [])
            setAmbientes(ambientesRes.data || [])
        } catch (error) {
            console.error('Error al cargar catálogo:', error.message)
        }
    }

    const loadStats = async () => {
        try {
            const { data } = await supabase
                .from('bienes')
                .select('tipo_equipo, estado')
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
                        costo_unitario: detalle.costo_unitario ? parseFloat(detalle.costo_unitario) : null,
                        lote: detalle.lote,
                        rendimiento: detalle.rendimiento ? parseInt(detalle.rendimiento) : null,
                        fecha_vencimiento: detalle.fecha_vencimiento || null
                    }])
                    .select()
                    .single()

                if (errDet) throw errDet

                const bienesData = []
                for (let i = 0; i < recibido; i++) {
                    const numSerie = String(i + 1).padStart(3, '0')
                    const serie = detalle.lote
                        ? `${detalle.lote}-${numSerie}`
                        : `${compraForm.orden_compra.replace(/[/\s]/g, '-')}-${numSerie}`

                    bienesData.push({
                        tipo_equipo: 'Tóner',
                        marca_id: detalle.marca_id || null,
                        modelo_id: detalle.modelo_id || null,
                        marca: detalle.marca,
                        modelo: detalle.modelo,
                        color_toner: detalle.color_toner,
                        serie,
                        lote: detalle.lote,
                        rendimiento: detalle.rendimiento ? parseInt(detalle.rendimiento) : null,
                        orden_compra: compraForm.orden_compra,
                        proveedor: compraForm.proveedor,
                        compra_detalle_id: detalleCreado.id,
                        estado: 'Disponible',
                        condicion: 'Bueno',
                        valor_compra: detalle.costo_unitario ? parseFloat(detalle.costo_unitario) : null,
                        ubicacion_almacen: detalle.ubicacion || '',
                        fecha_vencimiento: detalle.fecha_vencimiento || null,
                        other: compraForm.observaciones || ''
                    })
                }

                const { error: errBienes } = await supabase
                    .from('bienes')
                    .insert(bienesData)

                if (errBienes) throw errBienes
                totalCreados += recibido
            }

            mostrarToast(`✅ ${totalCreados} tóner(es) agregados a O/C ${compraForm.orden_compra}`)
            loadStats()
            cargarBienesPorCategoria(activeTab)
            cargarCompras(searchTerm)
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
            if (name === 'tipo_equipo') {
                if (value === 'Tóner') {
                    next.color = null
                    if (!editMode) {
                        next.condicion = 'Bueno'
                        next.estado = 'Disponible'
                    }
                } else if (prev.tipo_equipo === 'Tóner' && value !== 'Tóner') {
                    next.color = ''
                    if (!editMode) next.estado = 'Activo'
                }
            }
            if (name === 'marca_id') {
                const marca = marcas.find(m => m.id === value)
                next.marca = marca?.nombre || ''
                next.modelo_id = ''
                next.modelo = ''
            }
            if (name === 'modelo_id') {
                const modelo = modelos.find(m => m.id === value)
                next.modelo = modelo?.nombre || ''
            }
            return next
        })
        if (name === 'marca_id') {
            const filtrados = modelos.filter(m => m.marca_id === value)
            setModelosFiltrados(filtrados)
        }
    }

    const handleSubmit = async () => {
        if (!formData.tipo_equipo) {
            mostrarToast('El tipo de equipo es obligatorio', 'error')
            return
        }

        try {
            const safeFields = [
                'tipo_equipo', 'marca', 'modelo', 'marca_id', 'modelo_id',
                'serie', 'codigo_patrimonial', 'codigo_ti', 'anio_compra',
                'orden_compra', 'condicion', 'valor_compra', 'estado',
                'color_toner', 'color', 'rendimiento', 'lote',
                'fecha_vencimiento', 'proveedor', 'ubicacion_almacen', 'other'
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
            const nullableFields = ['fecha_vencimiento', 'valor_compra', 'rendimiento', 'anio_compra', 'codigo_ti', 'color']
            nullableFields.forEach(f => {
                if (sanitized[f] === '') sanitized[f] = null
            })

            if (editMode) {
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
            loadStats()
            cargarBienesPorCategoria(activeTab)
        } catch (error) {
            mostrarToast(handleApiError(error, 'guardar bien'), 'error')
        }
    }

    const handleEdit = (bien) => {
        setEditMode(true)
        setSelectedBien(bien)
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
            anio_compra: bien.anio_compra || new Date().getFullYear(),
            orden_compra: bien.orden_compra || '',
            condicion: bien.condicion || 'Bueno',
            valor_compra: bien.valor_compra || '',
            estado: bien.estado || 'Activo',
            color_toner: bien.color_toner || '',
            rendimiento: bien.rendimiento || '',
            lote: bien.lote || '',
            fecha_vencimiento: bien.fecha_vencimiento || '',
            proveedor: bien.proveedor || '',
            ubicacion_almacen: bien.ubicacion_almacen || ''
        })
        if (bien.marca_id) {
            const filtrados = modelos.filter(m => m.marca_id === bien.marca_id)
            setModelosFiltrados(filtrados)
            setMarcaManual(false)
        } else if (bien.marca) {
            setMarcaManual(true)
        }
        setOpenDrawer(true)
    }

    const handleDelete = (bien) => {
        setDeleteTarget(bien)
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        try {
            const { error } = await supabase
                .from('bienes')
                .delete()
                .eq('id', deleteTarget.id)

            if (error) throw error
            mostrarToast('Bien eliminado correctamente')
            loadStats()
            cargarBienesPorCategoria(activeTab)
        } catch (error) {
            mostrarToast(handleApiError(error, 'eliminar bien'), 'error')
        } finally {
            setDeleteTarget(null)
        }
    }

    const resetForm = () => {
        setEditMode(false)
        setSelectedBien(null)
        setMarcaManual(false)
        setModelosFiltrados([])
        setFormData({ ...emptyForm })
    }

    const stockPorModelo = {}
    bienes.forEach(b => {
        if (b.tipo_equipo === 'Tóner') {
            const key = `${b.marca}-${b.modelo}`
            stockPorModelo[key] = (stockPorModelo[key] || 0) + 1
        }
    })

    const filteredBienes = bienes.filter(bien => {
        const matchesSearch =
            bien.tipo_equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.codigo_patrimonial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.serie?.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        if (activeTab === 'computo') {
            return categorias.computo.includes(bien.tipo_equipo)
        } else if (activeTab === 'impresoras') {
            return categorias.impresoras.includes(bien.tipo_equipo)
        } else if (activeTab === 'perifericos') {
            return categorias.perifericos.includes(bien.tipo_equipo)
        } else if (activeTab === 'consumibles') {
            return bien.tipo_equipo === 'Tóner' || categorias.consumibles.includes(bien.tipo_equipo)
        } else if (activeTab === 'otros') {
            const todosTipos = [...categorias.computo, ...categorias.impresoras, ...categorias.perifericos, ...categorias.consumibles]
            return !todosTipos.includes(bien.tipo_equipo) && bien.tipo_equipo !== ''
        }

        return true
    })

    const stats = {
        total: statsLight.length,
        computo: statsLight.filter(b => categorias.computo.includes(b.tipo_equipo)).length,
        impresoras: statsLight.filter(b => categorias.impresoras.includes(b.tipo_equipo)).length,
        perifericos: statsLight.filter(b => categorias.perifericos.includes(b.tipo_equipo)).length,
        consumibles: statsLight.filter(b => categorias.consumibles.includes(b.tipo_equipo)).length,
        activos: statsLight.filter(b => b.estado === 'Activo').length
    }

    return {
        bienes, loading, searchTerm, setSearchTerm,
        openDrawer, setOpenDrawer,
        editMode, selectedBien,
        activeTab, setActiveTab,
        marcas, modelos, modelosFiltrados, marcaManual, setMarcaManual,
        comprasAgrupadas, openDetalleDrawer, setOpenDetalleDrawer,
        openCompraDrawer, setOpenCompraDrawer,
        selectedCompra, setSelectedCompra,
        selectedCompraToners, setSelectedCompraToners,
        prefillCompraId, setPrefillCompraId,
        ambientes,
        formData, setFormData,
        tonerCountsByDetalle, categorias,
        stockPorModelo, filteredBienes, stats,
        cargarBienes: cargarBienesPorCategoria, cargarCompras, cargarCatalogo, loadStats,
        handleAddMoreToCompra, handleCompraClick, handleBatchUpdate,
        handleRegistrarCompra,
        handleInputChange, handleSubmit, handleEdit, handleDelete, confirmDelete,
        deleteTarget, setDeleteTarget,
        resetForm
    }
}

export default useBienes
