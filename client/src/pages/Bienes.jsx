import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'
import {
    AddRegular,
    EditRegular,
    DeleteRegular,
    SearchRegular,
    ArrowSyncRegular,
    DismissRegular,
    DesktopRegular,
    EyeRegular,
    PrintRegular,
    KeyboardRegular,
    CartRegular,
    WindowDevToolsFilled,
    LaptopRegular,
    TvRegular,
    PhoneTabletRegular,
    ProjectionScreenRegular,
    DesktopKeyboardRegular
} from '@fluentui/react-icons'
import {
    Button,
    Input,
    Textarea,
    Select,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Card,
    Field,
    useToastController,
    Toast,
    ToastTitle,
    ToastBody,
    Toaster,
    Subtitle2,
    Divider,
    Caption1,
    Badge,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle,
    Tooltip
} from '@fluentui/react-components'
import CompraTonersDrawer from '../components/toners/CompraTonersDrawer'
import TonersPorOC from '../components/toners/TonersPorOC'
import DetalleOCDrawer from '../components/toners/DetalleOCDrawer'

const Bienes = () => {
    const [bienes, setBienes] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [openDrawer, setOpenDrawer] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedBien, setSelectedBien] = useState(null)
    const [activeTab, setActiveTab] = useState('computo') // 'computo', 'impresoras', 'perifericos', 'consumibles', 'otros'

    const [marcas, setMarcas] = useState([])
    const [modelos, setModelos] = useState([])
    const [modelosFiltrados, setModelosFiltrados] = useState([])
    const [marcaManual, setMarcaManual] = useState(false)

    // Estados para vista por O/C (Consumibles)
    const [comprasAgrupadas, setComprasAgrupadas] = useState([])
    const [openDetalleDrawer, setOpenDetalleDrawer] = useState(false)
    const [openCompraDrawer, setOpenCompraDrawer] = useState(false)
    const [selectedCompra, setSelectedCompra] = useState(null)
    const [selectedCompraToners, setSelectedCompraToners] = useState([])
    const [prefillCompraId, setPrefillCompraId] = useState('')

    const [ambientes, setAmbientes] = useState([])

    // Estados para el formulario
    const [formData, setFormData] = useState({
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
        // Campos específicos para tóner
        color_toner: '',
        rendimiento: '',
        lote: '',
        fecha_vencimiento: '',
        proveedor: '',
        ubicacion_almacen: ''
    })

    const { dispatchToast } = useToastController()

    // Definir categorías de equipos
    const categorias = {
        computo: ['Laptop', 'Desktop', 'CPU', 'Tablet', 'All-in-One'],
        impresoras: ['Impresora', 'Proyector', 'Multifuncional', 'Escáner', 'Plotter'],
        perifericos: ['Monitor', 'Teclado', 'Mouse', 'Parlantes', 'Diadema', 'Webcam', 'Router', 'Switch'],
        consumibles: ['Tóner', 'Cartucho', 'Cinta', 'Batería', 'Cargador'],
        otros: []
    }



    useEffect(() => {
        cargarBienes()
        cargarCatalogo()
        if (activeTab === 'consumibles') {
            cargarCompras()
        }
    }, [])

    useEffect(() => {
        if (activeTab === 'consumibles') {
            cargarCompras(searchTerm)
        }
    }, [activeTab])

    useEffect(() => {
        if (activeTab === 'consumibles') {
            cargarCompras(searchTerm)
        }
    }, [searchTerm])

    const cargarBienes = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('bienes')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            // Actualizar bienes directamente
            setBienes(data || [])

        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar bienes'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const mostrarToast = (mensaje, tipo = 'success') => {
        dispatchToast(
            <Toast>
                <ToastTitle>{tipo === 'success' ? '✅ Éxito' : '❌ Error'}</ToastTitle>
                <ToastBody>{mensaje}</ToastBody>
            </Toast>,
            { intent: tipo }
        )
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

    const [tonerCountsByDetalle, setTonerCountsByDetalle] = useState({})

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
                    counts[t.compra_detalle_id] = { activos: 0, asignados: 0, total: 0 }
                }
                if (t.estado === 'Activo') counts[t.compra_detalle_id].activos++
                else if (t.estado === 'Asignado') counts[t.compra_detalle_id].asignados++
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
        // Recargar la compra seleccionada para actualizar header del drawer
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
            cargarBienes()
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
            // Convertir cadenas vacías a null para columnas date/number
            const sanitized = { ...formData }
            const nullableFields = ['fecha_vencimiento', 'valor_compra', 'rendimiento', 'anio_compra', 'codigo_ti']
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
            cargarBienes()
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

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar este bien?')) {
            try {
                const { error } = await supabase
                    .from('bienes')
                    .delete()
                    .eq('id', id)

                if (error) throw error
                mostrarToast('Bien eliminado correctamente')
                cargarBienes()
            } catch (error) {
                mostrarToast(handleApiError(error, 'eliminar bien'), 'error')
            }
        }
    }

    const resetForm = () => {
        setEditMode(false)
        setSelectedBien(null)
        setMarcaManual(false)
        setModelosFiltrados([])
        setFormData({
            tipo_equipo: '',
            marca: '',
            modelo: '',
            marca_id: '',
            modelo_id: '',
            color: '',
            other: '',
            codigo_ti: '',
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
        })
    }

    // Mapa de stock por modelo (para badge en columna Stock)
    const stockPorModelo = {}
    bienes.forEach(b => {
        if (b.tipo_equipo === 'Tóner') {
            const key = `${b.marca}-${b.modelo}`
            stockPorModelo[key] = (stockPorModelo[key] || 0) + 1
        }
    })

    // Filtrar bienes según búsqueda y categoría
    const filteredBienes = bienes.filter(bien => {
        // Filtro por búsqueda
        const matchesSearch =
            bien.tipo_equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.codigo_patrimonial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bien.serie?.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        // Filtro por categoría
        if (activeTab === 'computo') {
            return categorias.computo.includes(bien.tipo_equipo)
        } else if (activeTab === 'impresoras') {
            return categorias.impresoras.includes(bien.tipo_equipo)
        } else if (activeTab === 'perifericos') {
            return categorias.perifericos.includes(bien.tipo_equipo)
        } else if (activeTab === 'consumibles') {
            // Mostramos todos los consumibles individualmente
            return bien.tipo_equipo === 'Tóner' || categorias.consumibles.includes(bien.tipo_equipo)
        } else if (activeTab === 'otros') {
            const todosTipos = [...categorias.computo, ...categorias.impresoras, ...categorias.perifericos, ...categorias.consumibles]
            return !todosTipos.includes(bien.tipo_equipo) && bien.tipo_equipo !== ''
        }

        return true
    })

    // Estadísticas por categoría
    const getEstadisticas = () => {
        return {
            total: bienes.length,
            computo: bienes.filter(b => categorias.computo.includes(b.tipo_equipo)).length,
            impresoras: bienes.filter(b => categorias.impresoras.includes(b.tipo_equipo)).length,
            perifericos: bienes.filter(b => categorias.perifericos.includes(b.tipo_equipo)).length,
            consumibles: bienes.filter(b => categorias.consumibles.includes(b.tipo_equipo)).length,
            activos: bienes.filter(b => b.estado === 'Activo').length
        }
    }

    const stats = getEstadisticas()

    return (
        <div className="p-1 space-y-6">
            <Toaster />

            {/* Header Principal con estadísticas */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Bienes</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Administración del inventario tecnológico</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        appearance="secondary"
                        icon={<CartRegular />}
                        onClick={() => {
                            setOpenCompraDrawer(true)
                        }}
                    >
                        Registrar Compra Tóneres
                    </Button>
                    <Button
                        appearance="primary"
                        icon={<AddRegular />}
                        onClick={() => {
                            resetForm()
                            setOpenDrawer(true)
                        }}
                    >
                        Nuevo Bien
                    </Button>
                </div>
            </div>

            {/* Tarjetas de estadísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Total Bienes</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Equipos Cómputo</p>
                    <p className="text-2xl font-bold">{stats.computo}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Impresoras</p>
                    <p className="text-2xl font-bold">{stats.impresoras}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Periféricos</p>
                    <p className="text-2xl font-bold">{stats.perifericos}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Consumibles</p>
                    <p className="text-2xl font-bold">{stats.consumibles}</p>
                </div>
            </div>

            {/* TABS DE NAVEGACIÓN */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-1 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('computo')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'computo'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <LaptopRegular />
                        <span>🖥️ Equipos de Cómputo</span>
                        <Badge appearance="filled" size="small" className="ml-1">{stats.computo}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('impresoras')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'impresoras'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <PrintRegular />
                        <span>🖨️ Impresoras y Proyectores</span>
                        <Badge appearance="filled" size="small" className="ml-1">{stats.impresoras}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('perifericos')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'perifericos'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <KeyboardRegular />
                        <span>⌨️ Periféricos</span>
                        <Badge appearance="filled" size="small" className="ml-1">{stats.perifericos}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('consumibles')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'consumibles'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <CartRegular />
                        <span>🧴 Consumibles (Tóner)</span>
                        <Badge appearance="filled" size="small" className="ml-1">{stats.consumibles}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('otros')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'otros'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <WindowDevToolsFilled />
                        <span>🔧 Otros Equipos</span>
                    </button>
                </nav>
            </div>

            {/* Barra de Búsqueda */}
            <Card className="!p-3">
                <div className="flex gap-3 items-center">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por tipo, marca, modelo, código patrimonial o serie..."
                            contentBefore={<SearchRegular />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button
                        icon={<ArrowSyncRegular />}
                        onClick={cargarBienes}
                        appearance="subtle"
                        size="small"
                    >
                        Sincronizar
                    </Button>
                </div>
            </Card>

            {/* VISTA POR TAB */}
            {activeTab === 'consumibles' ? (
                <TonersPorOC
                    compras={comprasAgrupadas}
                    tonerCountsByDetalle={tonerCountsByDetalle}
                    onCompraClick={handleCompraClick}
                    onAgregarMas={handleAddMoreToCompra}
                />
            ) : (
                /* Tabla estándar para otros tabs */
                <Card className="overflow-hidden !p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-500">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Cargando inventario...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHeaderCell><span className="font-semibold">Tipo</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Marca / Modelo</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Código Patrimonial</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Serie</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Condición</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Estado</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Acciones</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Stock</span></TableHeaderCell>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {filteredBienes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                                No se encontraron bienes registrados en esta categoría.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredBienes.map((bien) => (
                                            <TableRow key={bien.id} className="hover:bg-gray-50 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {bien.tipo_equipo === 'Laptop' && <LaptopRegular className="text-blue-500" />}
                                                        {bien.tipo_equipo === 'Impresora' && <PrintRegular className="text-purple-500" />}
                                                        {bien.tipo_equipo === 'Monitor' && <TvRegular className="text-green-500" />}
                                                        {bien.tipo_equipo === 'Tablet' && <PhoneTabletRegular className="text-black" />}
                                                        {bien.tipo_equipo === 'Desktop' && <DesktopKeyboardRegular className="text-orange-500" />}
                                                        {bien.tipo_equipo === 'Proyector' && <ProjectionScreenRegular className="text-green-500" />}
                                                        <b>{bien.tipo_equipo}</b>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className='text-sm'>{bien.marca || '-'} {bien.modelo || ''}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
                                                        {bien.codigo_patrimonial || 'SIN CÓDIGO'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{bien.serie || '-'}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bien.condicion === 'Bueno' ? 'bg-green-100 text-green-800' :
                                                        bien.condicion === 'Regular' ? 'bg-amber-100 text-amber-800' :
                                                            bien.condicion === 'Chatarra' ? 'bg-gray-200 text-gray-700' :
                                                                'bg-rose-100 text-rose-800'
                                                        }`}>
                                                        {bien.condicion}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bien.estado === 'Activo' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'
                                                        }`}>
                                                        {bien.estado}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Tooltip content="Editar bien" relationship="label">
                                                            <Button
                                                                appearance="subtle"
                                                                icon={<EditRegular />}
                                                                onClick={() => handleEdit(bien)}
                                                                size="small"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip content="Eliminar bien" relationship="label">
                                                            <Button
                                                                appearance="subtle"
                                                                icon={<DeleteRegular />}
                                                                onClick={() => handleDelete(bien.id)}
                                                                size="small"
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {bien.tipo_equipo === 'Tóner' ? (
                                                        <Badge appearance="filled" color="brand" size="small">
                                                            Stock: {stockPorModelo[`${bien.marca}-${bien.modelo}`] || 1}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>
            )}

            {/* DRAWER LATERAL CON VISTA PREVIA INTEGRADA */}
            <Drawer
                position="end"
                open={openDrawer}
                onOpenChange={(_, data) => setOpenDrawer(data.open)}
                style={{ width: "1100px" }}
            >
                <DrawerHeader className="border-b border-gray-100 pb-2 bg-gradient-to-r from-blue-50 to-white">
                    <DrawerHeaderTitle
                        action={
                            <Button
                                appearance="subtle"
                                aria-label="Close"
                                icon={<DismissRegular />}
                                onClick={() => setOpenDrawer(false)}
                            />
                        }
                    >
                        <div>
                            <span className="text-lg font-bold text-slate-800">
                                {editMode ? '✏️ Editar Registro Patrimonial' : '📝 Añadir Nuevo Bien al Sistema'}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">Complete los datos del equipo o bien patrimonial</p>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>

                <DrawerBody className="flex p-0 overflow-hidden">

                    {/* COLUMNA IZQUIERDA: EL FORMULARIO */}
                    <div className="w-7/12 p-6 overflow-y-auto border-r border-gray-100 flex flex-col gap-5 h-full" style={{ maxHeight: 'calc(100vh - 100px)' }}>

                        {/* Grupo 1 */}
                        <div className="flex flex-col gap-3">
                            <Subtitle2 className="text-blue-600 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                                1. Detalles del Hardware
                            </Subtitle2>
                            <Divider />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Tipo de Equipo" required>
                                    <Select name="tipo_equipo" value={formData.tipo_equipo} onChange={handleInputChange}>
                                        <option value="">Seleccionar tipo...</option>
                                        <optgroup label="🖥️ Equipos de Cómputo">
                                            <option value="Laptop">💻 Laptop</option>
                                            <option value="Desktop">🖥️ Desktop</option>
                                            <option value="CPU">📦 CPU</option>
                                            <option value="Tablet">📱 Tablet</option>
                                            <option value="All-in-One">🖥️ All-in-One</option>
                                        </optgroup>
                                        <optgroup label="🖨️ Impresoras y Proyectores">
                                            <option value="Impresora">🖨️ Impresora</option>
                                            <option value="Multifuncional">📠 Multifuncional</option>
                                            <option value="Proyector">📽️ Proyector</option>
                                            <option value="Escáner">🔍 Escáner</option>
                                            <option value="Plotter">📐 Plotter</option>
                                        </optgroup>
                                        <optgroup label="⌨️ Periféricos">
                                            <option value="Monitor">🖥️ Monitor</option>
                                            <option value="Teclado">⌨️ Teclado</option>
                                            <option value="Mouse">🖱️ Mouse</option>
                                            <option value="Parlantes">🔊 Parlantes</option>
                                            <option value="Router">📡 Router</option>
                                            <option value="Switch">🔌 Switch</option>
                                        </optgroup>
                                        <optgroup label="🧴 Consumibles">
                                            <option value="Tóner">🧴 Tóner</option>
                                            <option value="Cartucho">💦 Cartucho</option>
                                            <option value="Batería">🔋 Batería</option>
                                        </optgroup>
                                        <optgroup label="🔧 Otros">
                                            <option value="Otro">🔧 Otro</option>
                                        </optgroup>
                                    </Select>
                                </Field>

                                <Field label="Número de Serie">
                                    <Input name="serie" value={formData.serie || ''} onChange={handleInputChange} placeholder="SN-12345XYZ" />
                                </Field>

                                <Field label="Marca">
                                    {formData.tipo_equipo === 'Tóner' && !marcaManual ? (
                                        <div className="space-y-1">
                                            <select name="marca_id" value={formData.marca_id || ''} onChange={handleInputChange} className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white">
                                                <option value="">-- Seleccionar Marca --</option>
                                                {marcas.map(m => (
                                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                                ))}
                                            </select>
                                            <button type="button" onClick={() => setMarcaManual(true)} className="text-xs text-blue-600 hover:underline">
                                                ✏️ Escribir manualmente
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <Input name="marca" value={formData.marca || ''} onChange={handleInputChange} placeholder="HP, Lenovo, Epson" />
                                            {formData.tipo_equipo === 'Tóner' && (
                                                <button type="button" onClick={() => setMarcaManual(false)} className="text-xs text-blue-600 hover:underline">
                                                    📋 Usar catálogo
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </Field>

                                <Field label="Modelo">
                                    {formData.tipo_equipo === 'Tóner' && !marcaManual && formData.marca_id ? (
                                        <div className="space-y-1">
                                            <select name="modelo_id" value={formData.modelo_id || ''} onChange={handleInputChange} className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white">
                                                <option value="">-- Seleccionar Modelo --</option>
                                                {modelosFiltrados.map(m => (
                                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <Input name="modelo" value={formData.modelo || ''} onChange={handleInputChange} placeholder="ThinkPad E14, LaserJet Pro" />
                                    )}
                                </Field>

                                {formData.tipo_equipo !== 'Tóner' && (
                                    <Field label="Color">
                                        <Input name="color" value={formData.color || ''} onChange={handleInputChange} placeholder="Negro, Gris, Blanco" />
                                    </Field>
                                )}

                            </div>
                        </div>

                        {/* Grupo específico para Tóner */}
                        {formData.tipo_equipo === 'Tóner' && (
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                <Subtitle2 className="text-amber-700 flex items-center gap-2 mb-3">
                                    <CartRegular />
                                    Datos específicos del Tóner
                                </Subtitle2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Color del Tóner">
                                        <Select name="color_toner" value={formData.color_toner || ''} onChange={handleInputChange}>
                                            <option value="">Seleccionar color...</option>
                                            <option value="Negro">⚫ Negro</option>
                                            <option value="Cian">🔵 Cian</option>
                                            <option value="Magenta">🔴 Magenta</option>
                                            <option value="Amarillo">🟡 Amarillo</option>
                                        </Select>
                                    </Field>
                                    <Field label="Rendimiento (páginas)">
                                        <Input
                                            type="number"
                                            name="rendimiento"
                                            value={formData.rendimiento || ''}
                                            onChange={handleInputChange}
                                            placeholder="Ej. 1500 páginas"
                                        />
                                    </Field>
                                    <Field label="Número de Lote">
                                        <Input name="lote" value={formData.lote || ''} onChange={handleInputChange} placeholder="Lote de compra" />
                                    </Field>
                                    <Field label="Fecha Vencimiento">
                                        <Input name="fecha_vencimiento" type="date" value={formData.fecha_vencimiento || ''} onChange={handleInputChange} />
                                    </Field>
                                    <Field label="Proveedor">
                                        <Input name="proveedor" value={formData.proveedor || ''} onChange={handleInputChange} placeholder="Nombre del proveedor" />
                                    </Field>
                                    <Field label="Ubicación (Almacén)">
                                        <select
                                            name="ubicacion_almacen"
                                            value={formData.ubicacion_almacen || ''}
                                            onChange={handleInputChange}
                                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                                        >
                                            <option value="">Seleccionar ubicación...</option>
                                            {ambientes.map(a => (
                                                <option key={a.id} value={a.nombre}>📍 {a.nombre}</option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                            </div>
                        )}

                        {/* Grupo 3 */}
                        <div className="flex flex-col gap-3">
                            <Subtitle2 className="text-blue-600 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                                2. Identificadores Administrativos
                            </Subtitle2>
                            <Divider />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Código Patrimonial">
                                    <Input name="codigo_patrimonial" value={formData.codigo_patrimonial || ''} onChange={handleInputChange} placeholder="742212340001" className="font-mono" />
                                </Field>

                                <Field label="Código TI Interno">
                                    <Input name="codigo_ti" value={formData.codigo_ti || ''} onChange={handleInputChange} placeholder="UGEL-TI-045" className="font-mono" />
                                </Field>
                            </div>
                        </div>

                        {/* Grupo 4 */}
                        <div className="flex flex-col gap-3">
                            <Subtitle2 className="text-blue-600 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                                3. Logística y Estados
                            </Subtitle2>
                            <Divider />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Año Compra">
                                    <Input type="number" name="anio_compra" value={formData.anio_compra || ''} onChange={handleInputChange} />
                                </Field>

                                <Field label="Valor (S/)">
                                    <Input type="number" name="valor_compra" value={formData.valor_compra || ''} onChange={handleInputChange} placeholder="0.00" step="0.01" />
                                </Field>

                                <Field label="Orden Compra">
                                    <Input name="orden_compra" value={formData.orden_compra || ''} onChange={handleInputChange} placeholder="O/C 2026-089" />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {formData.tipo_equipo !== 'Tóner' && (
                                    <Field label="Condición Física">
                                        <Select name="condicion" value={formData.condicion} onChange={handleInputChange}>
                                            <option value="Bueno">✅ Bueno</option>
                                            <option value="Regular">⚠️ Regular</option>
                                            <option value="Malo">❌ Malo</option>
                                            <option value="Chatarra">🗑️ Chatarra</option>
                                        </Select>
                                    </Field>
                                )}

                                <Field label="Estado Operativo">
                                    <Select name="estado" value={formData.estado} onChange={handleInputChange}>
                                        {formData.tipo_equipo === 'Tóner' ? (
                                            <>
                                                <option value="Disponible">🟢 Disponible</option>
                                                <option value="Asignado">🟠 Asignado</option>
                                                <option value="Agotado">🔴 Agotado</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Activo">🔵 Activo</option>
                                                <option value="Dado de Baja">⚪ Dado de Baja</option>
                                            </>
                                        )}
                                    </Select>
                                </Field>
                            </div>
                        </div>

                        {/* Grupo 5 */}
                        <div className="flex flex-col gap-3">
                            <Subtitle2 className="text-blue-600 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                                4. Notas Adicionales
                            </Subtitle2>
                            <Divider />
                            <Field label="Observaciones">
                                <Textarea name="other" value={formData.other || ''} onChange={handleInputChange} rows={3} placeholder="Detalles de entrega, componentes incluidos, incidencias..." />
                            </Field>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: VISTA PREVIA DINÁMICA */}
                    <div className="w-5/12 bg-gray-50 p-6 flex flex-col justify-between h-full border-l border-gray-200">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-gray-500">
                                <EyeRegular />
                                <Caption1 className="uppercase tracking-wider font-semibold">Vista Previa del Registro</Caption1>
                            </div>

                            {/* Tarjeta de visualización final */}
                            <Card className="!p-5 bg-white border border-gray-200 shadow-sm flex flex-col gap-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
                                            {formData.tipo_equipo === 'Laptop' && <LaptopRegular style={{ fontSize: '28px' }} />}
                                            {formData.tipo_equipo === 'Impresora' && <PrintRegular style={{ fontSize: '28px' }} />}
                                            {formData.tipo_equipo === 'Tóner' && <CartRegular style={{ fontSize: '28px' }} />}
                                            {!['Laptop', 'Impresora', 'Tóner'].includes(formData.tipo_equipo) && <DesktopRegular style={{ fontSize: '28px' }} />}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-800 m-0">
                                                {formData.tipo_equipo || 'Nuevo Equipo'}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {formData.marca || 'Marca'} — {formData.modelo || 'Modelo'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${formData.condicion === 'Bueno' ? 'bg-green-100 text-green-800' :
                                        formData.condicion === 'Regular' ? 'bg-amber-100 text-amber-800' :
                                            formData.condicion === 'Chatarra' ? 'bg-gray-200 text-gray-700' :
                                                'bg-rose-100 text-rose-800'
                                        }`}>
                                        {formData.condicion || 'Pendiente'}
                                    </span>
                                </div>

                                <Divider />

                                {/* Códigos Principales */}
                                <div className="grid grid-cols-2 gap-x-2 gap-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Cód. Patrimonial</span>
                                        <span className="font-mono text-xs text-gray-700 font-semibold truncate block">
                                            {formData.codigo_patrimonial || 'No asignado'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Código TI Interno</span>
                                        <span className="font-mono text-xs text-gray-700 font-semibold truncate block">
                                            {formData.codigo_ti || 'No asignado'}
                                        </span>
                                    </div>
                                </div>

                                {/* Características Técnicas */}
                                <div className="grid grid-cols-2 gap-y-2 text-xs">
                                    <p className="text-gray-500">N° de Serie:</p>
                                    <p className="font-mono text-right text-gray-800 font-medium truncate">{formData.serie || '—'}</p>

                                    <p className="text-gray-500">Color:</p>
                                    <p className="text-right text-gray-800 font-medium">{formData.color || formData.color_toner || '—'}</p>

                                    <p className="text-gray-500">Año de Adquisición:</p>
                                    <p className="text-right text-gray-800 font-medium">{formData.anio_compra || '—'}</p>

                                    <p className="text-gray-500">Costo Unitario:</p>
                                    <p className="text-right font-semibold text-gray-900">
                                        {formData.valor_compra ? `S/ ${parseFloat(formData.valor_compra).toFixed(2)}` : 'S/ 0.00'}
                                    </p>
                                </div>

                                {/* Datos específicos de Tóner en vista previa */}
                                {formData.tipo_equipo === 'Tóner' && (
                                    <>
                                        <Divider />
                                        <div className="bg-amber-50 p-2 rounded-lg">
                                            <p className="text-[10px] uppercase font-bold text-amber-600 block mb-2">🧴 Datos del Consumible</p>
                                            <div className="grid grid-cols-2 gap-1 text-xs">
                                                <span className="text-gray-500">Color:</span>
                                                <span className="text-right font-medium">{formData.color_toner || '—'}</span>
                                                <span className="text-gray-500">Rendimiento:</span>
                                                <span className="text-right font-medium">{formData.rendimiento || '—'} páginas</span>
                                                <span className="text-gray-500">Lote:</span>
                                                <span className="text-right font-medium">{formData.lote || '—'}</span>
                                                <span className="text-gray-500">Proveedor:</span>
                                                <span className="text-right font-medium">{formData.proveedor || '—'}</span>
                                                {formData.fecha_vencimiento && (
                                                    <>
                                                        <span className="text-gray-500">Vencimiento:</span>
                                                        <span className="text-right font-medium">{formData.fecha_vencimiento}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Divider />

                                {/* Notas */}
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Observaciones</span>
                                    <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100 max-h-20 overflow-y-auto">
                                        {formData.other || 'Sin observaciones registradas.'}
                                    </p>
                                </div>
                            </Card>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex gap-2 justify-end bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 mt-4">
                            <Button appearance="secondary" onClick={() => setOpenDrawer(false)}>
                                Cancelar
                            </Button>
                            <Button appearance="primary" onClick={handleSubmit}>
                                {editMode ? 'Actualizar Registro' : 'Confirmar Guardado'}
                            </Button>
                        </div>
                    </div>

                </DrawerBody>
            </Drawer>

            {/* ========== DRAWER REGISTRAR COMPRA DE TÓNERES ========== */}
            <CompraTonersDrawer
                open={openCompraDrawer}
                onClose={() => {
                    setOpenCompraDrawer(false)
                    setPrefillCompraId('')
                }}
                marcas={marcas}
                modelos={modelos}
                prefillCompraId={prefillCompraId}
                onSave={handleRegistrarCompra}
            />

            {/* DRAWER DE DETALLE POR O/C */}
            <DetalleOCDrawer
                open={openDetalleDrawer}
                onClose={() => setOpenDetalleDrawer(false)}
                compra={selectedCompra}
                toners={selectedCompraToners}
                onEditToner={handleEdit}
                onAgregarMas={handleAddMoreToCompra}
                onBatchUpdate={handleBatchUpdate}
            />
        </div>
    )
}

export default Bienes