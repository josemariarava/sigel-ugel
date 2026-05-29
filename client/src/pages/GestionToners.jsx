import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
    AddRegular,
    EditRegular,
    DeleteRegular,
    SearchRegular,
    ArrowSyncRegular,
    DismissRegular,
    CartRegular,
    PrintRegular,
    PersonRegular,
    CalendarRegular,
    CheckmarkCircleRegular,
    DocumentPdfRegular,
    EyeRegular,
    HistoryRegular,
    WarningRegular,
    BuildingRegular
} from '@fluentui/react-icons'
import {
    Button,
    useToastController,
    Toast,
    ToastTitle,
    ToastBody,
    Toaster,
    Field,
    Input,
    Badge,
    Tooltip,
    Drawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerBody,
    DrawerFooter,
    Select,
    Textarea,
    Card
} from '@fluentui/react-components'

const GestionToners = () => {
    // ==================== ESTADOS ====================
    const [asignaciones, setAsignaciones] = useState([])
    const [toners, setToners] = useState([])
    const [impresoras, setImpresoras] = useState([])
    const [personas, setPersonas] = useState([])
    const [ambientes, setAmbientes] = useState([])
    const [pisos, setPisos] = useState([])
    const [selectedPiso, setSelectedPiso] = useState('')
    const [ambientesFiltrados, setAmbientesFiltrados] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [openDrawer, setOpenDrawer] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedAsignacion, setSelectedAsignacion] = useState(null)
    const [openTerminarModal, setOpenTerminarModal] = useState(false)
    const [terminarData, setTerminarData] = useState({
        fecha_terminado: new Date().toISOString().split('T')[0],
        observaciones: ''
    })

    // Estado para acta PDF
    const [openActaModal, setOpenActaModal] = useState(false)
    const [actaData, setActaData] = useState(null)

    // Estado para historial
    const [openHistorialModal, setOpenHistorialModal] = useState(false)
    const [historialAsignaciones, setHistorialAsignaciones] = useState([])

    const [formData, setFormData] = useState({
        toner_id: '',
        impresora_id: '',
        persona_id: '',
        ambiente_id: '',
        fecha_asignacion: new Date().toISOString().split('T')[0],
        observaciones: '',
        documento_referencia: ''
    })

    const [selectedTonerPreview, setSelectedTonerPreview] = useState(null)
    const [stockMismoModelo, setStockMismoModelo] = useState({ total: 0, disponibles: 0, asignados: 0 })
    const [entregadoPor, setEntregadoPor] = useState('')

    const { dispatchToast } = useToastController()

    // ==================== EFECTOS ====================
    useEffect(() => {
        cargarDatos()
    }, [])

    // Actualizar preview + stock al seleccionar un tóner
    useEffect(() => {
        if (formData.toner_id) {
            // Buscar en toners (nuevos) o en selectedAsignacion.toner (edit mode)
            const toner = toners.find(t => t.id === formData.toner_id) || selectedAsignacion?.toner
            setSelectedTonerPreview(toner || null)
            if (toner) {
                const asignadosActivos = asignaciones.filter(a => a.estado === 'Activo').map(a => a.toner_id)
                const mismoModelo = toners.filter(t => t.marca === toner.marca && t.modelo === toner.modelo)
                const disponibles = mismoModelo.filter(t => !asignadosActivos.includes(t.id))
                setStockMismoModelo({
                    total: mismoModelo.length,
                    disponibles: disponibles.length,
                    asignados: mismoModelo.length - disponibles.length
                })
            }
        } else {
            setSelectedTonerPreview(null)
            setStockMismoModelo({ total: 0, disponibles: 0, asignados: 0 })
        }
    }, [formData.toner_id, toners, asignaciones, selectedAsignacion])

    // Filtrar ambientes por piso seleccionado
    useEffect(() => {
        if (selectedPiso) {
            const filtrados = ambientes.filter(amb => amb.piso_id === selectedPiso)
            setAmbientesFiltrados(filtrados)
        } else {
            setAmbientesFiltrados([])
        }
    }, [selectedPiso, ambientes])

    // ==================== FUNCIONES PRINCIPALES ====================
    const cargarDatos = async () => {
        try {
            setLoading(true)

            const [
                asignacionesResult,
                tonersResult,
                impresorasResult,
                personasResult,
                ambientesResult,
                pisosResult,
                comprasDetalleResult,
            ] = await Promise.all([
                supabase.from('asignacion_toners').select(`
                    *,
                    toner:bienes!asignacion_toners_toner_id_fkey(*),
                    impresora:bienes!asignacion_toners_impresora_id_fkey(*),
                    persona:personas!asignacion_toners_persona_id_fkey(*),
                    ambiente:ambientes!asignacion_toners_ambiente_id_fkey(*)
                `).order('fecha_asignacion', { ascending: false }),
                supabase.from('bienes').select('*').eq('tipo_equipo', 'Tóner').in('estado', ['Disponible', 'Asignado']).order('marca'),
                supabase.from('bienes').select('*').in('tipo_equipo', ['Impresora', 'Multifuncional']).eq('estado', 'Activo').order('marca'),
                supabase.from('personas').select('*').order('apellidos'),
                supabase.from('ambientes').select('*, piso:pisos(*)').order('nombre'),
                supabase.from('pisos').select('*').order('numero'),
                supabase.from('compra_detalles').select('*, compra:compras_toners!compra_detalles_compra_id_fkey(*)'),
            ])

            // Si las joins nativas fallan (caché de PostgREST), usar mapeo manual como fallback
            let asignacionesData = asignacionesResult.data
            if (!asignacionesData || asignacionesResult.error) {
                const asignacionesBase = (await supabase.from('asignacion_toners').select('*').order('fecha_asignacion', { ascending: false })).data || []

                const tonerIds = [...new Set(asignacionesBase.map(a => a.toner_id).filter(Boolean))]
                const impresoraIds = [...new Set(asignacionesBase.map(a => a.impresora_id).filter(Boolean))]
                const personaIds = [...new Set(asignacionesBase.map(a => a.persona_id).filter(Boolean))]
                const ambienteIds = [...new Set(asignacionesBase.map(a => a.ambiente_id).filter(Boolean))]

                const todosIdsBienes = [...new Set([...tonerIds, ...impresoraIds])]
                const bienesRes = todosIdsBienes.length
                    ? await supabase.from('bienes').select('*').in('id', todosIdsBienes)
                    : { data: [] }
                const bienesMap = {}
                ;(bienesRes.data || []).forEach(b => { bienesMap[b.id] = b })

                const personasData = personasResult.data || []
                const ambientesData = ambientesResult.data || []
                const personasExtraIds = personaIds.filter(id => !personasData.some(p => p.id === id))
                const ambientesExtraIds = ambienteIds.filter(id => !ambientesData.some(a => a.id === id))
                const [persExtra, ambExtra] = await Promise.all([
                    personasExtraIds.length ? supabase.from('personas').select('*').in('id', personasExtraIds) : Promise.resolve({ data: [] }),
                    ambientesExtraIds.length ? supabase.from('ambientes').select('*').in('id', ambientesExtraIds) : Promise.resolve({ data: [] }),
                ])
                const personaMap = {}
                ;[...personasData, ...(persExtra.data || [])].forEach(p => { personaMap[p.id] = p })
                const ambienteMap = {}
                ;[...ambientesData, ...(ambExtra.data || [])].forEach(a => { ambienteMap[a.id] = a })

                asignacionesData = asignacionesBase.map(a => ({
                    ...a, toner: bienesMap[a.toner_id] || null, impresora: bienesMap[a.impresora_id] || null,
                    persona: personaMap[a.persona_id] || null, ambiente: ambienteMap[a.ambiente_id] || null,
                }))
            }

            // Vincular compra_detalles -> compras_toners
            let comprasData = comprasDetalleResult.data
            if (!comprasData || comprasDetalleResult.error) {
                const detalles = (await supabase.from('compra_detalles').select('*')).data || []
                const headerIds = [...new Set(detalles.map(d => d.compra_id).filter(Boolean))]
                const headers = headerIds.length ? (await supabase.from('compras_toners').select('*').in('id', headerIds)).data || [] : []
                const headerMap = {}
                headers.forEach(h => { headerMap[h.id] = h })
                comprasData = detalles.map(d => ({ ...d, compra: headerMap[d.compra_id] || null }))
            }
            const comprasMap = {}
            ;(comprasData || []).forEach(det => { comprasMap[det.id] = det })

            const tonersConCompra = (tonersResult.data || []).map(toner => ({
                ...toner,
                compra_detalle: comprasMap[toner.compra_detalle_id] || null
            }))

            setAsignaciones(asignacionesData || [])
            setToners(tonersConCompra)
            setImpresoras(impresorasResult.data || [])
            setPersonas(personasResult.data || [])
            setAmbientes(ambientesResult.data || [])
            setPisos(pisosResult.data || [])

        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar datos'), 'error')
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

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    // ==================== CRUD ASIGNACIONES ====================
    const handleSubmit = async () => {
        if (!formData.toner_id || !formData.persona_id) {
            mostrarToast('Complete los campos obligatorios', 'error')
            return
        }
        if (!editMode && !entregadoPor) {
            mostrarToast('Seleccione quien entrega el tóner', 'error')
            return
        }

        try {
            const payload = {
                toner_id: formData.toner_id,
                impresora_id: formData.impresora_id || null,
                persona_id: formData.persona_id,
                ambiente_id: formData.ambiente_id || null,
                fecha_asignacion: formData.fecha_asignacion,
                observaciones: formData.observaciones,
                documento_referencia: formData.documento_referencia,
                entregado_por: entregadoPor || null,
                ...(editMode ? { estado: selectedAsignacion.estado } : { estado: 'Activo' })
            }

            if (editMode) {
                const { error } = await supabase
                    .from('asignacion_toners')
                    .update(payload)
                    .eq('id', selectedAsignacion.id)

                if (error) throw error
                mostrarToast('Asignación actualizada correctamente')
            } else {
                // Generar número de acta único (basado en el máximo del año, no en COUNT)
                const anio = new Date().getFullYear()
                const { data: maxActaData } = await supabase
                    .from('asignacion_toners')
                    .select('numero_acta')
                    .like('numero_acta', `%-${anio}`)
                    .order('numero_acta', { ascending: false })
                    .limit(1)

                let nextNum = 1
                if (maxActaData && maxActaData.length > 0) {
                    const parts = maxActaData[0].numero_acta.split('-')
                    nextNum = parseInt(parts[0], 10) + 1
                }
                const numeroActa = `${String(nextNum).padStart(4, '0')}-${anio}`

                const { data, error } = await supabase
                    .from('asignacion_toners')
                    .insert([{ ...payload, numero_acta: numeroActa }])
                    .select()

                if (error) throw error

                // Actualizar estado del tóner a Asignado
                await supabase
                    .from('bienes')
                    .update({ estado: 'Asignado' })
                    .eq('id', formData.toner_id)

                // Generar acta automáticamente
                if (data && data[0]) {
                    await generarActa(data[0])
                }

                // Registrar movimiento con metadatos completos
                try {
                    await supabase
                        .from('toner_movimientos')
                        .insert([{
                            toner_id: formData.toner_id,
                            tipo: 'asignacion',
                            fecha: formData.fecha_asignacion,
                            descripcion: 'Tóner asignado',
                            metadata: {
                                asignacion_id: data[0].id,
                                persona: formData.persona_id,
                                ambiente: formData.ambiente_id || null,
                                impresora: formData.impresora_id || null,
                                numero_acta: numeroActa,
                                documento_referencia: formData.documento_referencia || null,
                                observaciones: formData.observaciones || null
                            }
                        }])
                } catch (movError) {
                    console.warn('Tabla toner_movimientos no disponible:', movError)
                }

                mostrarToast('Asignación registrada y acta generada ✅')
            }

            setOpenDrawer(false)
            resetForm()
            cargarDatos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'guardar asignación de tóner'), 'error')
        }
    }

    const handleEdit = (asignacion) => {
        setEditMode(true)
        setSelectedAsignacion(asignacion)
        setEntregadoPor(asignacion.entregado_por || '')
        setFormData({
            toner_id: asignacion.toner_id,
            impresora_id: asignacion.impresora_id || '',
            persona_id: asignacion.persona_id,
            ambiente_id: asignacion.ambiente_id || '',
            fecha_asignacion: asignacion.fecha_asignacion,
            observaciones: asignacion.observaciones || '',
            documento_referencia: asignacion.documento_referencia || ''
        })
        if (asignacion.ambiente_id) {
            const amb = ambientes.find(a => a.id === asignacion.ambiente_id)
            if (amb) setSelectedPiso(amb.piso_id || '')
        } else {
            setSelectedPiso('')
        }
        setOpenDrawer(true)
    }

    const handleDelete = async (asignacion) => {
        if (confirm('¿Estás seguro de eliminar esta asignación?')) {
            try {
                const { error } = await supabase
                    .from('asignacion_toners')
                    .delete()
                    .eq('id', asignacion.id)

                if (error) throw error

                // Liberar el tóner: volver a Disponible
                const { error: tonerError } = await supabase
                    .from('bienes')
                    .update({ estado: 'Disponible' })
                    .eq('id', asignacion.toner_id)

                if (tonerError) throw tonerError

                // Registrar movimiento de liberación con metadatos completos
                try {
                    await supabase
                        .from('toner_movimientos')
                        .insert([{
                            toner_id: asignacion.toner_id,
                            tipo: 'liberado',
                            fecha: new Date().toISOString().split('T')[0],
                            descripcion: 'Asignación eliminada, tóner liberado',
                            metadata: {
                                asignacion_id: asignacion.id,
                                persona: asignacion.persona_id || null,
                                ambiente: asignacion.ambiente_id || null,
                                impresora: asignacion.impresora_id || null,
                                numero_acta: asignacion.numero_acta,
                                documento_referencia: asignacion.documento_referencia || null,
                                observaciones: asignacion.observaciones || null
                            }
                        }])
                } catch (movError) {
                    console.warn('Tabla toner_movimientos no disponible:', movError)
                }

                mostrarToast('Asignación eliminada y tóner liberado')
                cargarDatos()
            } catch (error) {
                mostrarToast(handleApiError(error, 'eliminar asignación de tóner'), 'error')
            }
        }
    }

    // ==================== FUNCIÓN PARA TERMINAR TÓNER ====================
    const handleTerminar = async () => {
        if (!terminarData.fecha_terminado) {
            mostrarToast('Seleccione la fecha de terminado', 'error')
            return
        }

        try {
            const fechaAsignacion = new Date(selectedAsignacion.fecha_asignacion)
            const fechaTermino = new Date(terminarData.fecha_terminado)
            const duracionDias = Math.ceil((fechaTermino - fechaAsignacion) / (1000 * 60 * 60 * 24))

            // 1. Marcar la asignación como terminada
            const { error: updateError } = await supabase
                .from('asignacion_toners')
                .update({
                    fecha_terminado: terminarData.fecha_terminado,
                    duracion_dias: duracionDias,
                    estado: 'Terminado',
                    observaciones: terminarData.observaciones || selectedAsignacion.observaciones
                })
                .eq('id', selectedAsignacion.id)

            if (updateError) throw updateError

            // 2. Cambiar el estado del tóner a 'Disponible' o 'Agotado' según stock
            // Obtener cantidad actual de tóneres del mismo modelo
            const tonerActual = selectedAsignacion.toner
            const { data: tonersMismoModelo } = await supabase
                .from('bienes')
                .select('*')
                .eq('tipo_equipo', 'Tóner')
                .eq('marca', tonerActual.marca)
                .eq('modelo', tonerActual.modelo)
                .eq('estado', 'Activo')

            // Si es el último tóner de ese modelo, mostrar alerta
            if (tonersMismoModelo.length === 1) {
                mostrarToast(`⚠️ ALERTA: Es el último tóner ${tonerActual.marca} ${tonerActual.modelo}. ¡Reabastecer!`, 'warning')
            }

            // Marcar el tóner como agotado (consumido)
            const { error: tonerError } = await supabase
                .from('bienes')
                .update({ estado: 'Agotado' })
                .eq('id', selectedAsignacion.toner_id)

            if (tonerError) throw tonerError

            // Registrar movimiento de terminado
            try {
                await supabase
                    .from('toner_movimientos')
                    .insert([{
                        toner_id: selectedAsignacion.toner_id,
                        tipo: 'terminado',
                        fecha: terminarData.fecha_terminado,
                        descripcion: `Tóner terminado (${duracionDias} días)`,
                        metadata: { asignacion_id: selectedAsignacion.id, duracion_dias: duracionDias }
                    }])
            } catch (movError) {
                console.warn('Tabla toner_movimientos no disponible:', movError)
            }

            mostrarToast(`✅ Tóner marcado como terminado. Duración: ${duracionDias} días`, 'success')
            setOpenTerminarModal(false)
            cargarDatos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'terminar tóner'), 'error')
        }
    }

    const generarActa = async (asignacion) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const fechaActual = new Date().toLocaleDateString('es-PE', {
                year: 'numeric', month: 'long', day: 'numeric'
            })

            const personaRecibe = personas.find(p => p.id === asignacion.persona_id)
            const entregaPersonaId = asignacion.entregado_por || entregadoPor
            const entregador = personas.find(p => p.id === entregaPersonaId)
            const toner = toners.find(t => t.id === asignacion.toner_id)
            const impresora = impresoras.find(i => i.id === asignacion.impresora_id)
            const ambiente = ambientes.find(a => a.id === asignacion.ambiente_id)

            // Título
            doc.setFont('Helvetica', 'bold')
            doc.setFontSize(16)
            doc.setTextColor(0, 0, 0)
            doc.text('ACTA DE ENTREGA - RECEPCIÓN DE TÓNER', 105, 25, { align: 'center' })

            doc.setFontSize(10)
            doc.setFont('Helvetica', 'normal')
            doc.text(`Acta N°: ${asignacion.numero_acta || 'PENDIENTE'}`, 105, 35, { align: 'center' })

            // Cuerpo del acta
            doc.setFontSize(10)
            let y = 50

            doc.text(`En la ciudad de Cajamarca, a los ${new Date(asignacion.fecha_asignacion).getDate()} días del mes de ${new Date(asignacion.fecha_asignacion).toLocaleString('es-PE', { month: 'long' })} de ${new Date(asignacion.fecha_asignacion).getFullYear()},`, 20, y)
            y += 7
            doc.text(`reunidos en el local de la Unidad de Gestión Educativa Local de Cajamarca, sito en el Jr. Pisagua N° 466,`, 20, y)
            y += 7
            doc.text(`se procede a realizar la ENTREGA - RECEPCIÓN del siguiente bien consumible:`, 20, y)
            y += 10

            // Tabla de bienes
            const columnas = [
                { header: 'Tipo', dataKey: 'tipo' },
                { header: 'Marca/Modelo', dataKey: 'modelo' },
                { header: 'Serie', dataKey: 'serie' },
                { header: 'Color', dataKey: 'color' },
                { header: 'Rendimiento', dataKey: 'rendimiento' }
            ]

            const filas = [{
                tipo: 'TÓNER',
                modelo: `${toner?.marca || ''} ${toner?.modelo || ''}`,
                serie: toner?.serie || '-',
                color: toner?.color_toner || '-',
                rendimiento: toner?.rendimiento ? `${toner.rendimiento} págs` : '-'
            }]

            autoTable(doc, {
                columns: columnas,
                body: filas,
                startY: y,
                theme: 'striped',
                headStyles: {
                    fillColor: [0, 120, 212],
                    textColor: [255, 255, 255],
                    fontSize: 9,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fontSize: 8,
                    cellPadding: 3
                }
            })

            y = doc.lastAutoTable.finalY + 10

            // Datos de la impresora
            if (impresora) {
                doc.setFont('Helvetica', 'bold')
                doc.text('Impresora Destino:', 20, y)
                doc.setFont('Helvetica', 'normal')
                doc.text(`${impresora.marca} ${impresora.modelo} - Serie: ${impresora.serie || 'N/A'}`, 20, y + 7)
                y += 20
            }

            // Datos de ubicación
            if (ambiente) {
                const pisoNombre = ambiente.piso?.nombre || ''
                doc.text(`Ubicación: ${ambiente.nombre}${pisoNombre ? ` (${pisoNombre})` : ''}`, 20, y)
                y += 10
            }

            // Datos del responsable que recibe
            doc.setFont('Helvetica', 'bold')
            doc.text('Responsable que Recibe:', 20, y)
            doc.setFont('Helvetica', 'normal')
            doc.text(`${personaRecibe?.apellidos || ''}, ${personaRecibe?.nombres || ''} - DNI: ${personaRecibe?.dni || '-'}`, 20, y + 7)
            doc.text(`Cargo: ${personaRecibe?.cargo || '-'}`, 20, y + 14)
            y += 30

            // Nota
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 100)
            doc.text('NOTA: El presente tóner será utilizado única y exclusivamente en las funciones propias del cargo', 20, y)
            doc.text('dentro de la sede institucional de la UGEL Cajamarca.', 20, y + 6)
            y += 20

            // Firmas
            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)

            // Línea firma entrega
            doc.line(30, y, 80, y)
            doc.text('ENTREGÓ CONFORME', 45, y + 5)

            // Línea firma recibe
            doc.line(120, y, 170, y)
            doc.text('RECIBÍ CONFORME', 135, y + 5)

            // Cargo de quien entrega
            doc.setFontSize(8)
            doc.setTextColor(100, 100, 100)
            doc.text(entregador ? `${entregador.apellidos}, ${entregador.nombres}` : 'Fredy Arturo García Torres', 45, y + 12)
            doc.text(entregador?.cargo || 'Responsable de Oficina de Informática', 42, y + 17)
            doc.text(entregador?.dni ? `DNI: ${entregador.dni}` : 'DNI: 45715753', 55, y + 22)

            // Guardar PDF (descarga local)
            doc.save(`Acta_Toner_${asignacion.numero_acta || 'NUEVA'}.pdf`)

            // Subir a Supabase Storage
            try {
                const blob = doc.output('blob')
                const fileName = `actas/Acta_Toner_${asignacion.numero_acta || 'NUEVA'}.pdf`

                const { error: uploadError } = await supabase.storage
                    .from('actas')
                    .upload(fileName, blob, { contentType: 'application/pdf', upsert: true })

                if (uploadError) {
                    if (uploadError.message?.includes('bucket')) {
                        mostrarToast('⚠️ Crea el bucket "actas" en Supabase Storage (público) y vuelve a generar el acta.', 'warning')
                    } else {
                        console.warn('Error subiendo acta:', uploadError)
                        mostrarToast(`⚠️ Error al subir acta: ${uploadError.message}`, 'warning')
                    }
                } else {
                    const { data: urlData } = supabase.storage
                        .from('actas')
                        .getPublicUrl(fileName)

                    if (urlData?.publicUrl) {
                        const { error: updateError } = await supabase
                            .from('asignacion_toners')
                            .update({ acta_url: urlData.publicUrl })
                            .eq('id', asignacion.id)

                        if (updateError) {
                            console.warn('Error guardando acta_url:', updateError)
                        }
                    }
                }
            } catch (storageError) {
                console.warn('No se pudo subir el acta al storage:', storageError)
            }

            mostrarToast('Acta generada correctamente 📄', 'success')
            return true
        } catch (error) {
            mostrarToast(handleApiError(error, 'generar acta'), 'error')
            return false
        }
    }

    const generarActaManual = async (asignacion) => {
        await generarActa(asignacion)
    }

    // ==================== VER HISTORIAL (TIMELINE) ====================
    const verHistorial = async (tonerId) => {
        try {
            // Datos del tóner (incluye compra)
            const { data: tonerData } = await supabase
                .from('bienes').select('*, compra_detalle:compra_detalles(*)')
                .eq('id', tonerId).single()

            // Movimientos registrados (persisten aunque se elimine la asignación)
            const { data: movimientos } = await supabase
                .from('toner_movimientos').select('*')
                .eq('toner_id', tonerId)
                .order('fecha', { ascending: true })

            // Asignaciones actuales (solo las que no han sido eliminadas)
            const { data: rawAsignaciones } = await supabase
                .from('asignacion_toners').select('*')
                .eq('toner_id', tonerId)
                .order('fecha_asignacion', { ascending: true })

            // Recolectar IDs de personas, ambientes e impresoras desde asignaciones y movimientos
            const idsPersona = [...new Set([
                ...(rawAsignaciones || []).map(a => a.persona_id),
                ...(movimientos || []).map(m => m.metadata?.persona)
            ].filter(Boolean))]

            const idsAmbiente = [...new Set([
                ...(rawAsignaciones || []).map(a => a.ambiente_id),
                ...(movimientos || []).map(m => m.metadata?.ambiente)
            ].filter(Boolean))]

            const idsImpresora = [...new Set([
                ...(rawAsignaciones || []).map(a => a.impresora_id),
                ...(movimientos || []).map(m => m.metadata?.impresora)
            ].filter(Boolean))]

            // Traer header de compra si el tóner tiene compra_detalle
            let compraHeader = null
            if (tonerData?.compra_detalle?.compra_id) {
                const { data: ch } = await supabase
                    .from('compras_toners').select('*')
                    .eq('id', tonerData.compra_detalle.compra_id).single()
                compraHeader = ch
            }

            const [persRes, ambRes, impRes] = await Promise.all([
                idsPersona.length ? supabase.from('personas').select('*').in('id', idsPersona) : Promise.resolve({ data: [] }),
                idsAmbiente.length ? supabase.from('ambientes').select('*, piso:pisos(*)').in('id', idsAmbiente) : Promise.resolve({ data: [] }),
                idsImpresora.length ? supabase.from('bienes').select('*').in('id', idsImpresora) : Promise.resolve({ data: [] }),
            ])
            const persMap = {}; (persRes.data || []).forEach(p => { persMap[p.id] = p })
            const ambMap = {}; (ambRes.data || []).forEach(a => { ambMap[a.id] = a })
            const impMap = {}; (impRes.data || []).forEach(i => { impMap[i.id] = i })

            const asignaciones = (rawAsignaciones || []).map(a => ({
                ...a,
                persona: persMap[a.persona_id] || null,
                ambiente: ambMap[a.ambiente_id] || null,
                impresora: impMap[a.impresora_id] || null,
            }))

            // Construir timeline unificado
            const timeline = []

            // IDs de asignaciones activas (para detectar si un movimiento fue eliminado)
            const asignacionesActivasIds = new Set(asignaciones.map(a => a.id))

            // Evento de recepción (compra)
            if (tonerData?.compra_detalle || compraHeader) {
                const det = tonerData.compra_detalle || {}
                timeline.push({
                    id: 'recepcion',
                    tipo: 'recepcion',
                    fecha: compraHeader?.fecha_compra || det.created_at?.split('T')[0] || tonerData.created_at?.split('T')[0],
                    descripcion: `Tóner recibido`,
                    detalle: `${compraHeader?.orden_compra || 'S/N'}${compraHeader?.proveedor ? ` - ${compraHeader.proveedor}` : ''}`,
                    metadata: { marca: tonerData?.marca, modelo: tonerData?.modelo, serie: tonerData?.serie, vencimiento: tonerData?.fecha_vencimiento }
                })
            }

            // Eventos de movimientos
            ;(movimientos || []).forEach(m => {
                const p = m.metadata?.persona ? persMap[m.metadata.persona] : null
                const pName = p ? `${p.apellidos}, ${p.nombres}` : null
                const amb = m.metadata?.ambiente ? ambMap[m.metadata.ambiente] : null
                const imp = m.metadata?.impresora ? impMap[m.metadata.impresora] : null
                const acta = m.metadata?.numero_acta
                const doc = m.metadata?.documento_referencia
                const isDeleted = m.tipo === 'asignacion' && m.metadata?.asignacion_id && !asignacionesActivasIds.has(m.metadata.asignacion_id)

                let desc = m.descripcion
                let det = ''

                if (m.tipo === 'asignacion') {
                    desc = pName ? `Asignado a ${pName}` : 'Tóner asignado'
                    if (acta) det = `Acta: ${acta}`
                } else if (m.tipo === 'liberado') {
                    desc = pName ? `Liberado de ${pName}` : 'Asignación eliminada, tóner liberado'
                    if (acta) det = `Acta: ${acta}`
                }

                // Línea de detalle completa (impresora · ambiente · doc)
                const extra = []
                if (imp) extra.push(`${imp.marca || ''} ${imp.modelo || ''}`.trim())
                if (amb) extra.push(amb.nombre)
                if (doc && !det.includes(doc)) extra.push(`Doc: ${doc}`)
                if (extra.length) det = det ? `${det} · ${extra.join(' · ')}` : extra.join(' · ')

                timeline.push({
                    id: `mov-${m.id}`,
                    tipo: m.tipo,
                    fecha: m.fecha,
                    descripcion: desc,
                    detalle: det,
                    metadata: { ...(m.metadata || {}), personaObj: p, ambienteObj: amb, impresoraObj: imp, isDeleted }
                })
            })

            // Eventos de asignación/terminación actuales
            // (excluir si ya hay un movimiento de tipo 'asignacion' con ese asignacion_id)
            const asignacionIdsEnMovimientos = new Set(
                (movimientos || [])
                    .filter(m => m.tipo === 'asignacion' && m.metadata?.asignacion_id)
                    .map(m => m.metadata.asignacion_id)
            )
            ;(asignaciones || []).forEach(a => {
                if (asignacionIdsEnMovimientos.has(a.id)) return
                const pName = a.persona ? `${a.persona.apellidos}, ${a.persona.nombres}` : '—'
                timeline.push({
                    id: `asig-${a.id}`,
                    tipo: 'asignacion',
                    fecha: a.fecha_asignacion,
                    descripcion: `Asignado a ${pName}`,
                    detalle: `${a.impresora?.marca || ''} ${a.impresora?.modelo || ''}${a.ambiente?.nombre ? ` · ${a.ambiente.nombre}` : ''}`,
                    metadata: { asignacion: a, acta: a.numero_acta, doc: a.documento_referencia }
                })
                if (a.fecha_terminado) {
                    timeline.push({
                        id: `fin-${a.id}`,
                        tipo: 'terminado',
                        fecha: a.fecha_terminado,
                        descripcion: `Tóner terminado (${a.duracion_dias || '?'} días)`,
                        detalle: a.observaciones || '',
                        metadata: { asignacion: a }
                    })
                }
            })

            // Ordenar cronológico
            timeline.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

            setHistorialAsignaciones(timeline)
            setOpenHistorialModal(true)
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar historial'), 'error')
        }
    }

    const resetForm = () => {
        setEditMode(false)
        setSelectedAsignacion(null)
        setEntregadoPor('')
        setFormData({
            toner_id: '',
            impresora_id: '',
            persona_id: '',
            ambiente_id: '',
            fecha_asignacion: new Date().toISOString().split('T')[0],
            observaciones: '',
            documento_referencia: ''
        })
    }

    // ==================== FILTRADO ====================
    const filteredAsignaciones = asignaciones.filter(asig =>
        asig.toner?.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.toner?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.toner?.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.persona?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.impresora?.marca?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Tóneres disponibles (no asignados activos)
    const tonersDisponibles = toners.filter(toner =>
        !asignaciones.some(asig =>
            asig.toner_id === toner.id && asig.estado === 'Activo'
        )
    )

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'Activo': return 'bg-green-50 text-green-700 border-green-200'
            case 'Terminado': return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'Caducado': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
            case 'Dado de Baja': return 'bg-red-50 text-red-700 border-red-200'
            default: return 'bg-slate-100 text-slate-600'
        }
    }

    const calcularDuracion = (asignacion) => {
        if (asignacion.duracion_dias) {
            return asignacion.duracion_dias
        }
        if (asignacion.estado === 'Activo' && asignacion.fecha_asignacion) {
            const inicio = new Date(asignacion.fecha_asignacion)
            const hoy = new Date()
            const dias = Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))
            return `${dias} días (activo)`
        }
        return '-'
    }

    // ==================== RENDER ====================
    return (
        <div className="p-1 space-y-6">
            <Toaster />

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CartRegular className="text-blue-600" />
                        Gestión de Tóneres y Consumibles
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Control de asignación, seguimiento y actas de entrega</p>
                </div>
                <Button
                    appearance="primary"
                    icon={<AddRegular />}
                    onClick={() => { resetForm(); setOpenDrawer(true) }}
                >
                    Nueva Asignación
                </Button>
            </div>

            {/* ESTADÍSTICAS RÁPIDAS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Total Asignaciones</p>
                    <p className="text-2xl font-bold">{asignaciones.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Activos</p>
                    <p className="text-2xl font-bold">{asignaciones.filter(a => a.estado === 'Activo').length}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Terminados</p>
                    <p className="text-2xl font-bold">{asignaciones.filter(a => a.estado === 'Terminado').length}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Tóneres Stock</p>
                    <p className="text-2xl font-bold">{tonersDisponibles.length}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Impresoras</p>
                    <p className="text-2xl font-bold">{impresoras.length}</p>
                </div>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <Card className="!p-3">
                <div className="flex gap-3 items-center">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por marca, modelo, serie, responsable o impresora..."
                            contentBefore={<SearchRegular />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button icon={<ArrowSyncRegular />} onClick={cargarDatos} appearance="subtle">
                        Sincronizar
                    </Button>
                </div>
            </Card>

            {/* TABLA DE ASIGNACIONES */}
            <Card className="overflow-hidden !p-0">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Cargando asignaciones...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500 border-b">
                                <tr>
                                    <th className="px-4 py-3">Tóner</th>
                                    <th className="px-4 py-3">Serie / Código</th>
                                    <th className="px-4 py-3">Responsable</th>
                                    <th className="px-4 py-3">Impresora</th>
                                    <th className="px-4 py-3">Ubicación</th>
                                    <th className="px-4 py-3">Fecha Asig.</th>
                                    <th className="px-4 py-3">Duración</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[10px]">
                                {filteredAsignaciones.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-12 text-gray-500">
                                            No hay asignaciones de tóneres registradas
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAsignaciones.map((asig) => (
                                        <tr key={asig.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <CartRegular className="text-amber-600" />
                                                    <div>
                                                        <span className="font-medium">{asig.toner?.marca} {asig.toner?.modelo}</span>
                                                        {asig.toner?.compra_detalle?.compra && (
                                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                                O/C: {asig.toner.compra_detalle.compra.orden_compra}
                                                                {asig.toner.compra_detalle.compra.proveedor && ` | ${asig.toner.compra_detalle.compra.proveedor}`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{asig.toner?.serie || '-'}</td>
                                            <td className="px-4 py-3">{asig.persona?.apellidos}, {asig.persona?.nombres}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <PrintRegular className="text-gray-400 text-sm" />
                                                    <span className="text-xs">{asig.impresora?.marca} {asig.impresora?.modelo}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{asig.ambiente?.nombre || '-'}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{asig.fecha_asignacion}</td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {calcularDuracion(asig)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getEstadoColor(asig.estado)}`}>
                                                    {asig.estado || 'Activo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex gap-1 justify-center">
                                                    {asig.estado === 'Activo' && (
                                                        <Tooltip content="Marcar como terminado">
                                                            <Button
                                                                size="small"
                                                                appearance="subtle"
                                                                icon={<CheckmarkCircleRegular />}
                                                                className="text-green-600"
                                                                onClick={() => {
                                                                    setSelectedAsignacion(asig)
                                                                    setOpenTerminarModal(true)
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip content="Ver Historial">
                                                        <Button
                                                            size="small"
                                                            appearance="subtle"
                                                            icon={<HistoryRegular />}
                                                            onClick={() => verHistorial(asig.toner_id)}
                                                        />
                                                    </Tooltip>
                                                    {asig.acta_url ? (
                                                        <Tooltip content="Ver Acta">
                                                            <a href={asig.acta_url} target="_blank" rel="noopener noreferrer">
                                                                <Button size="small" appearance="subtle" icon={<EyeRegular />} className="text-blue-600" />
                                                            </a>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip content="Generar Acta">
                                                            <Button
                                                                size="small"
                                                                appearance="subtle"
                                                                icon={<DocumentPdfRegular />}
                                                                className="text-red-600"
                                                                onClick={() => generarActaManual(asig)}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip content="Editar">
                                                        <Button
                                                            size="small"
                                                            appearance="subtle"
                                                            icon={<EditRegular />}
                                                            onClick={() => handleEdit(asig)}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip content="Eliminar">
                                                        <Button
                                                            size="small"
                                                            appearance="subtle"
                                                            icon={<DeleteRegular />}
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(asig)}
                                                        />
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* ==================== DRAWER - NUEVA ASIGNACIÓN ==================== */}
            <Drawer position="end" open={openDrawer} onOpenChange={(_, data) => setOpenDrawer(data.open)} size='medium'>
                <DrawerHeader className="border-b bg-gradient-to-r from-amber-50 to-white">
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenDrawer(false)} />}>
                        <div>
                            <span className="text-lg font-bold text-slate-800">
                                {editMode ? '✏️ Editar Asignación de Tóner' : '📝 Nueva Asignación de Tóner'}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">Complete los datos para la entrega del consumible</p>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>

                <DrawerBody className="p-6 space-y-5">
                    <Field label="Tóner a Asignar *" required>
                        <select
                            name="toner_id"
                            value={formData.toner_id}
                            onChange={handleInputChange}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                            disabled={editMode}
                        >
                            <option value="">-- Seleccionar Tóner --</option>
                            {(editMode ? toners : tonersDisponibles).map(t => (
                                <option key={t.id} value={t.id}>
                                    🧴 {t.marca} {t.modelo} - {t.color_toner || 'N/A'} - Serie: {t.serie || 'N/A'}{t.compra_detalle?.compra ? ` | O/C: ${t.compra_detalle.compra.orden_compra}` : ''}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {/* Vista previa del tóner seleccionado */}
                    {selectedTonerPreview && (
                        <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-amber-800">📦 Tóner Seleccionado</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                <div><span className="text-gray-500">Marca:</span> <span className="font-medium">{selectedTonerPreview.marca}</span></div>
                                <div><span className="text-gray-500">Modelo:</span> <span className="font-medium">{selectedTonerPreview.modelo}</span></div>
                                <div><span className="text-gray-500">Serie:</span> <span className="font-mono text-xs">{selectedTonerPreview.serie || '—'}</span></div>
                                <div><span className="text-gray-500">Color:</span> <span>{selectedTonerPreview.color_toner || '—'}</span></div>
                                <div><span className="text-gray-500">Rendimiento:</span> <span>{selectedTonerPreview.rendimiento ? `${selectedTonerPreview.rendimiento} págs` : '—'}</span></div>
                                <div><span className="text-gray-500">Lote:</span> <span className="font-mono text-xs">{selectedTonerPreview.lote || '—'}</span></div>
                                <div><span className="text-gray-500">Vencimiento:</span> <span>{selectedTonerPreview.fecha_vencimiento || '—'}</span></div>
                                <div><span className="text-gray-500">Ubicación almacén:</span> <span>{selectedTonerPreview.ubicacion_almacen || '—'}</span></div>
                            </div>
                            {selectedTonerPreview.compra_detalle?.compra && (
                                <div className="text-xs text-gray-500 border-t border-amber-200 pt-2 mt-1">
                                    O/C: <strong>{selectedTonerPreview.compra_detalle.compra.orden_compra}</strong>
                                    {selectedTonerPreview.compra_detalle.compra.proveedor && ` | Proveedor: ${selectedTonerPreview.compra_detalle.compra.proveedor}`}
                                </div>
                            )}
                            {/* Stock del modelo */}
                            <div className="bg-white rounded-lg p-3 border border-amber-200 mt-2">
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Stock del modelo {selectedTonerPreview.marca} {selectedTonerPreview.modelo}</p>
                                <div className="flex gap-4 text-sm">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Disponibles: <strong>{stockMismoModelo.disponibles}</strong>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        Asignados: <strong>{stockMismoModelo.asignados}</strong>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        Total: <strong>{stockMismoModelo.total}</strong>
                                    </span>
                                </div>
                                {stockMismoModelo.disponibles === 0 && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ No quedan tóneres disponibles de este modelo</p>
                                )}
                            </div>
                        </div>
                    )}

                    <Field label="Entregado por *" required>
                        <select
                            value={entregadoPor}
                            onChange={(e) => setEntregadoPor(e.target.value)}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Seleccionar quien entrega --</option>
                            {personas.map(p => (
                                <option key={p.id} value={p.id}>
                                    👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Impresora Destino">
                        <select
                            name="impresora_id"
                            value={formData.impresora_id}
                            onChange={handleInputChange}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Seleccionar Impresora --</option>
                            {impresoras.map(i => (
                                <option key={i.id} value={i.id}>
                                    🖨️ {i.marca} {i.modelo} - {i.serie || 'Sin serie'}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Responsable que Recibe *" required>
                        <select
                            name="persona_id"
                            value={formData.persona_id}
                            onChange={handleInputChange}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Seleccionar Responsable --</option>
                            {personas.map(p => (
                                <option key={p.id} value={p.id}>
                                    👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Piso">
                            <select
                                value={selectedPiso}
                                onChange={(e) => { setSelectedPiso(e.target.value); setFormData({ ...formData, ambiente_id: '' }) }}
                                className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                            >
                                <option value="">-- Piso --</option>
                                {pisos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre || `Piso ${p.numero}`}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Ambiente">
                            <select
                                name="ambiente_id"
                                value={formData.ambiente_id}
                                onChange={(e) => { handleInputChange(e); if (e.target.value) { const amb = ambientes.find(a => a.id === e.target.value); if (amb) setSelectedPiso(amb.piso_id || '') } }}
                                className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                            >
                                <option value="">-- Ambiente --</option>
                                {(selectedPiso ? ambientesFiltrados : ambientes).map(a => (
                                    <option key={a.id} value={a.id}>
                                        📍 {a.nombre} ({a.codigo})
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Fecha de Asignación">
                            <input
                                type="date"
                                name="fecha_asignacion"
                                value={formData.fecha_asignacion}
                                onChange={handleInputChange}
                                className="w-full text-sm border rounded-lg px-3 py-2.5"
                            />
                        </Field>

                        <Field label="Documento Referencia">
                            <input
                                type="text"
                                name="documento_referencia"
                                value={formData.documento_referencia}
                                onChange={handleInputChange}
                                placeholder="Ej. Memorando N° 001-2026"
                                className="w-full text-sm border rounded-lg px-3 py-2.5"
                            />
                        </Field>
                    </div>

                    <Field label="Observaciones">
                        <textarea
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleInputChange}
                            rows="3"
                            placeholder="Notas adicionales sobre la entrega..."
                            className="w-full text-sm border rounded-lg px-3 py-2 resize-none"
                        />
                    </Field>
                </DrawerBody>

                <DrawerFooter className="border-t pt-4 pb-4 bg-gray-50 flex justify-end gap-3">
                    <Button appearance="secondary" onClick={() => setOpenDrawer(false)}>Cancelar</Button>
                    <Button appearance="primary" onClick={handleSubmit}>
                        {editMode ? 'Actualizar' : 'Confirmar Asignación'}
                    </Button>
                </DrawerFooter>
            </Drawer>

            {/* ==================== MODAL - MARCAR COMO TERMINADO ==================== */}
            {openTerminarModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-4 border-b bg-gradient-to-r from-green-50 to-white">
                            <h3 className="text-lg font-bold text-green-800">✅ Marcar Tóner como Terminado</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm font-medium">Tóner: {selectedAsignacion?.toner?.marca} {selectedAsignacion?.toner?.modelo}</p>
                                <p className="text-xs text-gray-500">Serie: {selectedAsignacion?.toner?.serie}</p>
                                <p className="text-xs text-gray-500 mt-1">Asignado a: {selectedAsignacion?.persona?.apellidos}, {selectedAsignacion?.persona?.nombres}</p>
                                <p className="text-xs text-gray-500">Fecha de asignación: {selectedAsignacion?.fecha_asignacion}</p>
                            </div>

                            <Field label="Fecha de terminado">
                                <input
                                    type="date"
                                    value={terminarData.fecha_terminado}
                                    onChange={(e) => setTerminarData({ ...terminarData, fecha_terminado: e.target.value })}
                                    className="w-full text-sm border rounded-lg px-3 py-2"
                                />
                            </Field>

                            <Field label="Observaciones finales">
                                <textarea
                                    rows="2"
                                    value={terminarData.observaciones}
                                    onChange={(e) => setTerminarData({ ...terminarData, observaciones: e.target.value })}
                                    placeholder="Ej. Tóner agotado, rendimiento normal..."
                                    className="w-full text-sm border rounded-lg px-3 py-2 resize-none"
                                />
                            </Field>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <Button appearance="secondary" onClick={() => setOpenTerminarModal(false)}>Cancelar</Button>
                            <Button appearance="primary" onClick={handleTerminar}>Confirmar Terminado</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MODAL - HISTORIAL (TIMELINE) ==================== */}
            {openHistorialModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-white flex justify-between items-center">
                            <h3 className="text-lg font-bold text-purple-800">📜 Línea de Tiempo</h3>
                            <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenHistorialModal(false)} />
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[65vh]">
                            {(() => {
                                const now = Date.now()
                                const activeThreshold = new Date(now - 120 * 24 * 60 * 60 * 1000)
                                const expiryWarning = new Date(now + 30 * 24 * 60 * 60 * 1000)

                                if (historialAsignaciones.length === 0) {
                                    return <div className="text-center py-8 text-gray-400">No hay historial disponible</div>
                                }

                                return (
                                    <div className="relative">
                                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                                        {historialAsignaciones.map((event, idx) => {
                                            const isRecepcion = event.tipo === 'recepcion'
                                            const isAsignacion = event.tipo === 'asignacion'
                                            const isTerminado = event.tipo === 'terminado'
                                            const isLiberado = event.tipo === 'liberado'
                                            const isEliminado = isAsignacion && event.metadata?.isDeleted

                                            let color, icon, borderColor, bgColor

                                            if (isRecepcion) {
                                                color = 'bg-emerald-500'; icon = '📦'; borderColor = 'border-emerald-200'; bgColor = 'bg-emerald-50'
                                            } else if (isAsignacion) {
                                                if (isEliminado) {
                                                    color = 'bg-red-400'; icon = '👤'; borderColor = 'border-red-200'; bgColor = 'bg-red-50'
                                                } else {
                                                    color = 'bg-blue-500'; icon = '👤'; borderColor = 'border-blue-200'; bgColor = 'bg-blue-50'
                                                }
                                            } else if (isTerminado) {
                                                color = 'bg-amber-500'; icon = '✅'; borderColor = 'border-amber-200'; bgColor = 'bg-amber-50'
                                            } else if (isLiberado) {
                                                color = 'bg-orange-500'; icon = '🔄'; borderColor = 'border-orange-200'; bgColor = 'bg-orange-50'
                                            } else if (event.tipo === 'reabastecimiento') {
                                                color = 'bg-purple-500'; icon = '📥'; borderColor = 'border-purple-200'; bgColor = 'bg-purple-50'
                                            } else {
                                                color = 'bg-gray-500'; icon = '🔄'; borderColor = 'border-gray-200'; bgColor = 'bg-gray-50'
                                            }

                                            const formatFecha = (f) => {
                                                if (!f) return ''
                                                return new Date(f).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
                                            }

                                            const fechaEvento = new Date(event.fecha)
                                            const diasActivo = Math.floor((now - fechaEvento.getTime()) / (1000 * 60 * 60 * 24))
                                            const esVencido = new Date(event.metadata?.vencimiento) < new Date()
                                            const porVencer = !esVencido && new Date(event.metadata?.vencimiento) < expiryWarning

                                            return (
                                                <div key={event.id || idx} className="relative flex gap-4 pb-6 last:pb-0">
                                                    <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs shadow-md`}>
                                                        <span>{icon}</span>
                                                    </div>

                                                    <div className={`flex-1 border rounded-lg p-3 ${borderColor} ${bgColor}`}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-semibold text-sm">{event.descripcion}</p>
                                                                {event.detalle && (
                                                                    <p className="text-xs text-gray-500 mt-0.5">{event.detalle}</p>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                                {formatFecha(event.fecha)}
                                                            </span>
                                                        </div>

                                                        {/* Badge para eventos eliminados */}
                                                        {isEliminado && (
                                                            <div className="mt-2">
                                                                <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 font-medium">
                                                                    ❌ Esta asignación fue eliminada (no terminada)
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Información contextual según tipo de evento */}
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {/* Acta (común a todos) */}
                                                            {event.metadata?.acta && (
                                                                <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                                    Acta: {event.metadata.acta}
                                                                </span>
                                                            )}
                                                            {event.metadata?.numero_acta && !event.metadata?.acta && (
                                                                <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                                    Acta: {event.metadata.numero_acta}
                                                                </span>
                                                            )}

                                                            {/* Documento de referencia */}
                                                            {(event.metadata?.doc || event.metadata?.documento_referencia) && (
                                                                <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                                    Doc: {event.metadata.doc || event.metadata.documento_referencia}
                                                                </span>
                                                            )}

                                                            {/* Ubicación (ambiente) */}
                                                            {(event.metadata?.ambienteObj || event.metadata?.asignacion?.ambiente) && (
                                                                <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                                    📍 {event.metadata.ambienteObj?.nombre || event.metadata.asignacion.ambiente?.nombre}
                                                                </span>
                                                            )}

                                                            {/* Impresora */}
                                                            {(event.metadata?.impresoraObj || event.metadata?.asignacion?.impresora) && (
                                                                <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                                    🖨️ {(event.metadata.impresoraObj?.marca || '') + ' ' + (event.metadata.impresoraObj?.modelo || event.metadata.asignacion?.impresora?.modelo || '')}
                                                                </span>
                                                            )}

                                                            {/* Observaciones */}
                                                            {event.metadata?.observaciones && (
                                                                <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-400 italic">
                                                                    "{event.metadata.observaciones}"
                                                                </span>
                                                            )}

                                                            {/* Asignación prolongada (solo eventos activos actuales) */}
                                                            {isAsignacion && !isEliminado && event.metadata?.asignacion?.estado === 'Activo' && fechaEvento < activeThreshold && (
                                                                <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 font-medium">
                                                                    ⚠️ Asignación prolongada ({diasActivo} días)
                                                                </span>
                                                            )}

                                                            {/* Duración para terminados */}
                                                            {isTerminado && event.metadata?.asignacion?.duracion_dias && (
                                                                <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                                    ⏱️ Duración: {event.metadata.asignacion.duracion_dias} días
                                                                </span>
                                                            )}

                                                            {/* Serie para recepción */}
                                                            {isRecepcion && event.metadata?.serie && (
                                                                <span className="text-xs bg-white px-2 py-0.5 rounded border text-gray-600">
                                                                    Serie: {event.metadata.serie}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Alerta de vencimiento */}
                                                        {isRecepcion && event.metadata?.vencimiento && (
                                                            <div className="mt-2">
                                                                {esVencido ? (
                                                                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 font-medium">
                                                                        ⚠️ VENCIDO: {formatFecha(event.metadata.vencimiento)}
                                                                    </span>
                                                                ) : porVencer ? (
                                                                    <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200 font-medium">
                                                                        ⏳ Por vencer: {formatFecha(event.metadata.vencimiento)}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GestionToners