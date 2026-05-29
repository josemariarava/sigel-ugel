import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import GestionToners from './GestionToners'


import {
    AddRegular,
    EditRegular,
    DeleteRegular,
    SearchRegular,
    ArrowSyncRegular,
    LocationRegular,
    BuildingRegular,
    DismissRegular,
    CalendarRegular,
    CheckmarkCircleRegular,
    BoxRegular,
    PersonRegular,
    ArrowSwapRegular,
    ArrowReplyRegular,
    WarningRegular,
    HistoryRegular,
    DocumentPdfRegular,
    EyeRegular,
    CartRegular,
    TableRegular  // 👈 Agrega esta línea
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
    DrawerFooter
} from '@fluentui/react-components'

const Asignaciones = () => {

    // Estado para la pestaña activa
    const [activeTab, setActiveTab] = useState('lista') // 'lista' o 'mapa'
    const [distribucionVista, setDistribucionVista] = useState('piso') // 'piso' o 'area'


    // ==================== ESTADOS ====================
    const [asignaciones, setAsignaciones] = useState([])
    const [bienes, setBienes] = useState([])
    const [personas, setPersonas] = useState([])
    const [areas, setAreas] = useState([])
    const [pisos, setPisos] = useState([])
    const [todosLosAmbientes, setTodosLosAmbientes] = useState([])
    const [ambientesFiltrados, setAmbientesFiltrados] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [openModal, setOpenModal] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedAsignacion, setSelectedAsignacion] = useState(null)
    const [selectedPiso, setSelectedPiso] = useState('')
    const [exportandoPdf, setExportandoPdf] = useState(false)

    // Estados para búsqueda de bienes
    const [searchTermBien, setSearchTermBien] = useState('')
    const [showBienDropdown, setShowBienDropdown] = useState(false)

    const [openTrasladoModal, setOpenTrasladoModal] = useState(false)
    const [openHistorialModal, setOpenHistorialModal] = useState(false)
    const [historialMovimientos, setHistorialMovimientos] = useState([])
    const [loadingHistorial, setLoadingHistorial] = useState(false)
    const [historialBienInfo, setHistorialBienInfo] = useState(null)

    // Estados para vista detallada
    const [openDetalleModal, setOpenDetalleModal] = useState(false)
    const [selectedPersonaDetalle, setSelectedPersonaDetalle] = useState(null)
    const [bienesPorPersona, setBienesPorPersona] = useState([])

    // Estados para información contextual
    const [infoResponsable, setInfoResponsable] = useState(null)
    const [infoAmbiente, setInfoAmbiente] = useState(null)
    const [infoNuevoResponsable, setInfoNuevoResponsable] = useState(null)
    const [infoNuevoAmbiente, setInfoNuevoAmbiente] = useState(null)

    const [trasladoData, setTrasladoData] = useState({
        tipo: 'traslado',
        persona_destino_id: '',
        ambiente_destino_id: '',
        motivo: '',
        motivo_especifico: '',
        documento_referencia: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
        usuario_registro: ''
    })

    const [formData, setFormData] = useState({
        bien_id: '',
        persona_id: '',
        oficina_id: '',
        ambiente_id: '',
        fecha_asignacion: new Date().toISOString().split('T')[0],
        documento_referencia: '',
        persona_origen_id: '',
        motivo: '',
        observaciones: '',
        estado_asignacion: 'Activo'
    })

    const { dispatchToast } = useToastController()

    const [estadisticas, setEstadisticas] = useState({
        totalAsignaciones: 0,
        activos: 0,
        trasladados: 0,
        devueltos: 0,
        baja: 0,
        enAlmacen: 0
    })

    const [filtros, setFiltros] = useState({
        fechaInicio: '',
        fechaFin: '',
        tipoBien: '',
        estadoFiltro: ''
    })

    const [openReporteModal, setOpenReporteModal] = useState(false)
    const [reporteData, setReporteData] = useState([])
    const [fechasReporte, setFechasReporte] = useState({
        inicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    })

    const [exportando, setExportando] = useState(false)

    // ==================== FILTRADOS ====================
    const filteredAsignaciones = asignaciones.filter(asig =>
        asig.bien?.tipo_equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.bien?.codigo_patrimonial?.includes(searchTerm) ||
        asig.persona?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.persona?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.ambiente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const aplicarFiltrosAvanzados = (asignacion) => {
        let coincide = true
        if (filtros.fechaInicio && asignacion.fecha_asignacion < filtros.fechaInicio) coincide = false
        if (filtros.fechaFin && asignacion.fecha_asignacion > filtros.fechaFin) coincide = false
        if (filtros.tipoBien && asignacion.bien?.tipo_equipo !== filtros.tipoBien) coincide = false
        if (filtros.estadoFiltro && asignacion.estado_asignacion !== filtros.estadoFiltro) coincide = false
        return coincide
    }

    const asignacionesFiltradasAvanzado = filteredAsignaciones.filter(aplicarFiltrosAvanzados)

    const bienesDisponibles = bienes.filter(bien =>
        !asignaciones.some(asig =>
            asig.bien_id === bien.id && asig.estado_asignacion === 'Activo'
        )
    )

    // Bienes filtrados para búsqueda
    const bienesFiltrados = (editMode ? bienes : bienesDisponibles).filter(bien =>
        bien.tipo_equipo?.toLowerCase().includes(searchTermBien.toLowerCase()) ||
        bien.marca?.toLowerCase().includes(searchTermBien.toLowerCase()) ||
        bien.modelo?.toLowerCase().includes(searchTermBien.toLowerCase()) ||
        bien.codigo_patrimonial?.toLowerCase().includes(searchTermBien.toLowerCase()) ||
        bien.serie?.toLowerCase().includes(searchTermBien.toLowerCase())
    )

    // ==================== EFECTOS ====================
    useEffect(() => {
        cargarDatos()
    }, [])

    useEffect(() => {
        if (selectedPiso) {
            const filtrados = todosLosAmbientes.filter(amb => amb.piso_id === selectedPiso)
            setAmbientesFiltrados(filtrados)
        } else {
            setAmbientesFiltrados([])
        }
    }, [selectedPiso, todosLosAmbientes])

    useEffect(() => {
        if (asignaciones.length > 0) {
            calcularEstadisticas()
            verificarBienesSinMovimiento()
        }
    }, [asignaciones])

    // ==================== FUNCIONES PRINCIPALES ====================
    const cargarDatos = async () => {
        try {
            setLoading(true)
            const [asignacionesResult, bienesResult, personasResult, pisosResult, ambientesResult, areasResult] = await Promise.all([
                supabase.from('asignaciones').select(`*, bien:bienes(*), persona:personas(*), ambiente:ambientes(*, piso:pisos(*))`).order('fecha_asignacion', { ascending: false }),
                supabase.from('bienes').select('*').in('estado', ['Activo', 'Asignado']).order('tipo_equipo'),
                supabase.from('personas').select('*, area:areas(*)').order('apellidos'),
                supabase.from('pisos').select('*').order('numero'),
                supabase.from('ambientes').select('*, piso:pisos(*), area:areas(*)').order('nombre'),
                supabase.from('areas').select('*').order('nombre'),
            ])

            setAsignaciones(asignacionesResult.data || [])
            setBienes(bienesResult.data || [])
            setPersonas(personasResult.data || [])
            setPisos(pisosResult.data || [])
            setTodosLosAmbientes(ambientesResult.data || [])
            setAreas(areasResult.data || [])

        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar datos'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const calcularEstadisticas = () => {
        const stats = {
            totalAsignaciones: asignaciones.length,
            activos: asignaciones.filter(a => a.estado_asignacion === 'Activo').length,
            trasladados: asignaciones.filter(a => a.estado_asignacion === 'Trasladado').length,
            devueltos: asignaciones.filter(a => a.estado_asignacion === 'Devuelto').length,
            baja: asignaciones.filter(a => a.estado_asignacion === 'Baja').length,
            enAlmacen: asignaciones.filter(a =>
                a.ambiente?.nombre === 'Almacén General' && a.estado_asignacion === 'Devuelto'
            ).length
        }
        setEstadisticas(stats)
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

    // ==================== FUNCIONES DE VISTA DETALLADA ====================
    const verBienesPorPersona = (personaId, personaNombre, personaApellidos) => {
        const bienesAsignados = asignaciones.filter(asig =>
            asig.persona_id === personaId &&
            asig.estado_asignacion === 'Activo'
        )
        setBienesPorPersona(bienesAsignados)
        setSelectedPersonaDetalle({
            id: personaId,
            nombre: `${personaNombre} ${personaApellidos}`,
            esUbicacion: false,
            personaData: personas.find(p => p.id === personaId)
        })
        setOpenDetalleModal(true)
    }

    const verBienesPorUbicacion = (ambienteId) => {
        const ambienteSeleccionado = todosLosAmbientes.find(a => a.id === ambienteId)
        const bienesEnUbicacion = asignaciones.filter(asig =>
            asig.ambiente_id === ambienteId &&
            asig.estado_asignacion === 'Activo'
        )
        setBienesPorPersona(bienesEnUbicacion)
        setSelectedPersonaDetalle({
            id: ambienteId,
            nombre: ambienteSeleccionado?.nombre || 'Ambiente',
            esUbicacion: true,
            ambienteData: ambienteSeleccionado
        })
        setOpenDetalleModal(true)
    }

    // ==================== MANEJADORES CON INFORMACIÓN CONTEXTUAL ====================
    const handlePersonaChange = (e) => {
        const personaId = e.target.value
        const personaSeleccionada = personas.find(p => p.id === personaId)
        setFormData({ ...formData, persona_id: personaId })

        if (personaSeleccionada) {
            setInfoResponsable({
                nombres: `${personaSeleccionada.nombres} ${personaSeleccionada.apellidos}`,
                dni: personaSeleccionada.dni,
                cargo: personaSeleccionada.cargo || 'No especificado',
                email: personaSeleccionada.email || 'No registrado',
                telefono: personaSeleccionada.telefono || 'No registrado'
            })
        } else {
            setInfoResponsable(null)
        }
    }

    const handleAmbienteChange = (e) => {
        const ambienteId = e.target.value
        const ambienteSeleccionado = todosLosAmbientes.find(a => a.id === ambienteId)
        setFormData({ ...formData, ambiente_id: ambienteId })

        if (ambienteSeleccionado) {
            const cantidadBienes = asignaciones.filter(a => a.ambiente_id === ambienteId && a.estado_asignacion === 'Activo').length
            setInfoAmbiente({
                nombre: ambienteSeleccionado.nombre,
                codigo: ambienteSeleccionado.codigo,
                piso: ambienteSeleccionado.piso?.nombre || `Piso ${ambienteSeleccionado.piso?.numero}`,
                tipo: ambienteSeleccionado.tipo || 'Oficina',
                area: ambienteSeleccionado.area?.nombre || null,
                bienesOcupados: cantidadBienes
            })
        } else {
            setInfoAmbiente(null)
        }
    }

    const handleNuevoResponsableChange = (e) => {
        const personaId = e.target.value
        const personaSeleccionada = personas.find(p => p.id === personaId)
        setTrasladoData({ ...trasladoData, persona_destino_id: personaId })

        if (personaSeleccionada) {
            setInfoNuevoResponsable({
                nombres: `${personaSeleccionada.nombres} ${personaSeleccionada.apellidos}`,
                dni: personaSeleccionada.dni,
                cargo: personaSeleccionada.cargo || 'No especificado'
            })
        } else {
            setInfoNuevoResponsable(null)
        }
    }

    const handleNuevoAmbienteChange = (e) => {
        const ambienteId = e.target.value
        const ambienteSeleccionado = todosLosAmbientes.find(a => a.id === ambienteId)
        setTrasladoData({ ...trasladoData, ambiente_destino_id: ambienteId })

        if (ambienteSeleccionado) {
            setInfoNuevoAmbiente({
                nombre: ambienteSeleccionado.nombre,
                codigo: ambienteSeleccionado.codigo,
                piso: ambienteSeleccionado.piso?.nombre || `Piso ${ambienteSeleccionado.piso?.numero}`
            })
        } else {
            setInfoNuevoAmbiente(null)
        }
    }

    // ==================== GENERAR ACTA DE CARGO PDF ====================
    const generarActaCargo = async (personaId, personaNombre, personaApellidos, personaData) => {
        try {
            setExportandoPdf(true)

            const bienesPersona = asignaciones.filter(asig =>
                asig.persona_id === personaId &&
                asig.estado_asignacion === 'Activo'
            )

            if (bienesPersona.length === 0) {
                mostrarToast('Esta persona no tiene bienes asignados activos', 'error')
                return
            }

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const fechaActual = new Date().toLocaleDateString('es-PE', {
                year: 'numeric', month: 'long', day: 'numeric'
            })

            // Encabezado
            doc.setFillColor(0, 120, 212)
            doc.rect(0, 0, doc.internal.pageSize.width, 3, 'F')

            doc.setFont('Helvetica', 'bold')
            doc.setFontSize(18)
            doc.setTextColor(32, 31, 30)
            doc.text('ACTA DE ASIGNACIÓN Y CARGO DE BIENES', 20, 20)

            doc.setFont('Helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(96, 94, 92)
            doc.text(`Fecha: ${fechaActual}`, 20, 30)

            // Datos del responsable
            doc.setFont('Helvetica', 'bold')
            doc.setFontSize(12)
            doc.setTextColor(0, 120, 212)
            doc.text('DATOS DEL SERVIDOR PÚBLICO RESPONSABLE', 20, 45)

            doc.setFont('Helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(50, 49, 48)
            doc.text(`Nombres: ${personaNombre} ${personaApellidos}`, 20, 55)
            doc.text(`DNI: ${personaData?.dni || '-'}`, 20, 62)
            doc.text(`Cargo: ${personaData?.cargo || '-'}`, 20, 69)
            doc.text(`Correo: ${personaData?.email || '-'}`, 20, 76)

            // Tabla de bienes
            doc.setFont('Helvetica', 'bold')
            doc.setFontSize(12)
            doc.setTextColor(0, 120, 212)
            doc.text('BIENES ASIGNADOS BAJO SU RESPONSABILIDAD', 20, 90)

            const columnas = [
                { header: 'Tipo de Bien', dataKey: 'tipo' },
                { header: 'Marca/Modelo', dataKey: 'modelo' },
                { header: 'Código Patrimonial', dataKey: 'codigo' },
                { header: 'Serie', dataKey: 'serie' },
                { header: 'Ubicación', dataKey: 'ubicacion' }
            ]

            const filas = bienesPersona.map(asig => ({
                tipo: asig.bien?.tipo_equipo || '',
                modelo: `${asig.bien?.marca || 'S/M'} ${asig.bien?.modelo || 'S/M'}`,
                codigo: asig.bien?.codigo_patrimonial || '-',
                serie: asig.bien?.serie || '-',
                ubicacion: asig.ambiente?.nombre || 'Almacén General'
            }))

            autoTable(doc, {
                columns: columnas,
                body: filas,
                startY: 95,
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

            // Firmas
            const finalY = doc.lastAutoTable.finalY + 20

            doc.line(20, finalY, 80, finalY)
            doc.setFontSize(9)
            doc.setTextColor(96, 94, 92)
            doc.text('Firma del Responsable', 30, finalY + 5)

            doc.line(130, finalY, 190, finalY)
            doc.text('Huella Digital / Constancia', 145, finalY + 5)

            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text('Documento de control patrimonial - Copia para el servidor', 20, finalY + 15)
            doc.text(`Total de bienes asignados: ${bienesPersona.length}`, 20, finalY + 22)

            doc.save(`cargo_${personaApellidos}_${new Date().toISOString().split('T')[0]}.pdf`)

            mostrarToast('Acta de cargo generada correctamente 📄', 'success')
        } catch (error) {
            mostrarToast(handleApiError(error, 'generar acta'), 'error')
        } finally {
            setExportandoPdf(false)
        }
    }

    // ==================== GENERAR ACTA PDF POR ASIGNACIÓN ====================
    const generarActaAsignacion = async (asignacion) => {
        try {
            setExportandoPdf(true)

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
            const fechaActual = new Date().toLocaleDateString('es-PE', {
                year: 'numeric', month: 'long', day: 'numeric'
            })

            // Encabezado
            doc.setFillColor(0, 120, 212)
            doc.rect(0, 0, doc.internal.pageSize.width, 3, 'F')
            doc.setFont('Helvetica', 'bold')
            doc.setFontSize(16)
            doc.setTextColor(32, 31, 30)
            doc.text('ACTA DE ASIGNACIÓN DE BIEN PATRIMONIAL', 105, 20, { align: 'center' })
            doc.setFontSize(10)
            doc.setFont('Helvetica', 'normal')
            doc.setTextColor(96, 94, 92)
            doc.text(`Acta N°: ${asignacion.numero_acta || 'PENDIENTE'}`, 105, 30, { align: 'center' })

            // Datos del responsable
            doc.setFont('Helvetica', 'bold')
            doc.setFontSize(12)
            doc.setTextColor(0, 120, 212)
            doc.text('SERVIDOR PÚBLICO RESPONSABLE', 20, 45)
            doc.setFont('Helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(50, 49, 48)
            doc.text(`Nombres: ${asignacion.persona?.nombres || ''} ${asignacion.persona?.apellidos || ''}`, 20, 55)
            doc.text(`DNI: ${asignacion.persona?.dni || '-'}`, 20, 62)
            doc.text(`Cargo: ${asignacion.persona?.cargo || '-'}`, 20, 69)

            // Datos del bien
            doc.setFont('Helvetica', 'bold')
            doc.setFontSize(12)
            doc.setTextColor(0, 120, 212)
            doc.text('BIEN ASIGNADO', 20, 85)
            doc.setFont('Helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(50, 49, 48)

            const bien = asignacion.bien || {}
            const dataBien = [
                ['Tipo', bien.tipo_equipo || '-'],
                ['Marca / Modelo', `${bien.marca || 'S/M'} ${bien.modelo || 'S/M'}`],
                ['Código Patrimonial', bien.codigo_patrimonial || '-'],
                ['Serie', bien.serie || '-'],
                ['Condición', bien.condicion || '-'],
                ['Ubicación', asignacion.ambiente?.nombre || 'Almacén General'],
                ['Piso', asignacion.ambiente?.piso?.nombre || '-'],
                ['Fecha Asignación', asignacion.fecha_asignacion || '-'],
                ['Documento Ref.', asignacion.documento_referencia || '-'],
                ['Observaciones', asignacion.observaciones || 'Ninguna']
            ]

            autoTable(doc, {
                body: dataBien,
                startY: 92,
                theme: 'grid',
                headStyles: { fillColor: [0, 120, 212], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
                bodyStyles: { fontSize: 8 },
                columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } }
            })

            // Firmas
            const finalY = doc.lastAutoTable.finalY + 25
            doc.setFontSize(10)
            doc.setTextColor(50, 49, 48)
            doc.line(20, finalY, 80, finalY)
            doc.setFontSize(9)
            doc.setTextColor(96, 94, 92)
            doc.text('Firma del Responsable', 30, finalY + 5)
            doc.line(130, finalY, 190, finalY)
            doc.text('Constancia de Recepción', 142, finalY + 5)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(`Fecha de emisión: ${fechaActual}  |  Documento de control patrimonial`, 20, finalY + 15)

            doc.save(`Acta_Equipo_${asignacion.numero_acta || 'NUEVA'}.pdf`)

            // Subir a Storage
            try {
                const blob = doc.output('blob')
                const fileName = `actas/equipos/Acta_Equipo_${asignacion.numero_acta || 'NUEVA'}.pdf`

                const { error: uploadError } = await supabase.storage
                    .from('actas')
                    .upload(fileName, blob, { contentType: 'application/pdf', upsert: true })

                if (uploadError) {
                    console.warn('Error subiendo acta:', uploadError)
                    mostrarToast(`⚠️ Error al subir acta: ${uploadError.message}`, 'warning')
                } else {
                    const { data: urlData } = supabase.storage
                        .from('actas')
                        .getPublicUrl(fileName)

                    if (urlData?.publicUrl) {
                        await supabase
                            .from('asignaciones')
                            .update({ acta_url: urlData.publicUrl })
                            .eq('id', asignacion.id)

                        // Refrescar el registro en el state local
                        setAsignaciones(prev => prev.map(a =>
                            a.id === asignacion.id ? { ...a, acta_url: urlData.publicUrl } : a
                        ))
                    }
                }
            } catch (storageError) {
                console.warn('No se pudo subir el acta al storage:', storageError)
            }

            mostrarToast('Acta generada correctamente 📄', 'success')
        } catch (error) {
            mostrarToast(handleApiError(error, 'generar acta'), 'error')
        } finally {
            setExportandoPdf(false)
        }
    }

    // ==================== EXPORTACIÓN Y REPORTES ====================
    const exportarAExcel = async () => {
        try {
            setExportando(true)
            const datosExportar = asignacionesFiltradasAvanzado.map(asig => ({
                'Tipo de Bien': asig.bien?.tipo_equipo,
                'Marca': asig.bien?.marca || '',
                'Modelo': asig.bien?.modelo || '',
                'Código Patrimonial': asig.bien?.codigo_patrimonial || '',
                'Serie': asig.bien?.serie || '',
                'Responsable': `${asig.persona?.apellidos} ${asig.persona?.nombres}`,
                'DNI': asig.persona?.dni || '',
                'Cargo': asig.persona?.cargo || '',
                'Ubicación': `${asig.ambiente?.nombre || ''} (Piso ${asig.ambiente?.piso?.numero || ''})`,
                'Fecha Asignación': asig.fecha_asignacion,
                'Estado': asig.estado_asignacion,
                'Observaciones': asig.observaciones || ''
            }))

            const headers = Object.keys(datosExportar[0] || {})
            const csvRows = [headers.join(',')]

            for (const row of datosExportar) {
                const values = headers.map(header => {
                    const value = row[header] || ''
                    return `"${String(value).replace(/"/g, '""')}"`
                })
                csvRows.push(values.join(','))
            }

            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.href = url
            link.setAttribute('download', `asignaciones_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            mostrarToast('Exportación completada ✅', 'success')
        } catch (error) {
            mostrarToast(handleApiError(error, 'exportar datos'), 'error')
        } finally {
            setExportando(false)
        }
    }

    const exportarAPdf = async () => {
        try {
            setExportandoPdf(true)

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            })

            const fechaActual = new Date().toLocaleDateString('es-PE', {
                year: 'numeric', month: 'long', day: 'numeric'
            })

            const columnas = [
                { header: 'Tipo de Bien', dataKey: 'tipo' },
                { header: 'Código Pat.', dataKey: 'codigo' },
                { header: 'Marca/Modelo', dataKey: 'modelo' },
                { header: 'Responsable', dataKey: 'responsable' },
                { header: 'Ubicación', dataKey: 'ubicacion' },
                { header: 'Fecha', dataKey: 'fecha' },
                { header: 'Estado', dataKey: 'estado' }
            ]

            const filas = asignacionesFiltradasAvanzado.map(asig => ({
                tipo: asig.bien?.tipo_equipo || '',
                codigo: asig.bien?.codigo_patrimonial || '',
                modelo: `${asig.bien?.marca || 'S/M'} ${asig.bien?.modelo || 'S/M'}`,
                responsable: asig.persona ? `${asig.persona.apellidos}, ${asig.persona.nombres}` : 'No asignado',
                ubicacion: `${asig.ambiente?.nombre || 'Almacén General'} (Piso ${asig.ambiente?.piso?.numero ?? '0'})`,
                fecha: asig.fecha_asignacion || '',
                estado: asig.estado_asignacion || ''
            }))

            autoTable(doc, {
                columns: columnas,
                body: filas,
                startY: 28,
                theme: 'striped',
                styles: {
                    font: 'Helvetica',
                    fontSize: 9,
                    cellPadding: 4,
                },
                headStyles: {
                    fillColor: [0, 120, 212],
                    textColor: [255, 255, 255],
                    fontSize: 9,
                    fontStyle: 'bold'
                },
                didDrawPage: (data) => {
                    doc.setFillColor(0, 120, 212)
                    doc.rect(0, 0, doc.internal.pageSize.width, 3, 'F')
                    doc.setFont('Helvetica', 'bold')
                    doc.setFontSize(16)
                    doc.setTextColor(32, 31, 30)
                    doc.text('Reporte de Asignaciones Patrimoniales', 14, 15)
                    doc.setFont('Helvetica', 'normal')
                    doc.setFontSize(9)
                    doc.setTextColor(96, 94, 92)
                    doc.text(`Generado: ${fechaActual}`, 14, 21)
                }
            })

            doc.save(`reporte_asignaciones_${new Date().toISOString().split('T')[0]}.pdf`)
            mostrarToast('PDF generado correctamente 📄', 'success')
        } catch (error) {
            mostrarToast(handleApiError(error, 'generar PDF'), 'error')
        } finally {
            setExportandoPdf(false)
        }
    }

    const generarReportePorPeriodo = async () => {
        try {
            const { data, error } = await supabase
                .from('historial_movimientos')
                .select(`
          *,
          bien:bienes(tipo_equipo, codigo_patrimonial),
          tipo_movimiento:tipos_movimiento(nombre),
          persona_origen:personas!historial_movimientos_persona_origen_id_fkey(nombres, apellidos),
          persona_destino:personas!historial_movimientos_persona_destino_id_fkey(nombres, apellidos)
        `)
                .gte('fecha_movimiento', fechasReporte.inicio)
                .lte('fecha_movimiento', fechasReporte.fin)
                .order('fecha_movimiento', { ascending: false })

            if (error) throw error
            setReporteData(data || [])
            setOpenReporteModal(true)
        } catch (error) {
            mostrarToast(handleApiError(error, 'generar reporte'), 'error')
        }
    }

    const verificarBienesSinMovimiento = () => {
        const tresMesesAtras = new Date()
        tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3)

        const bienesInactivos = asignaciones.filter(asig =>
            asig.estado_asignacion === 'Activo' &&
            new Date(asig.fecha_actualizacion || asig.fecha_asignacion) < tresMesesAtras
        )

        if (bienesInactivos.length > 0) {
            mostrarToast(`📢 ${bienesInactivos.length} bienes sin movimiento en los últimos 3 meses`, 'info')
        }
    }

    // ==================== TRASLADOS Y MOVIMIENTOS ====================
    const cargarHistorialMovimientos = async (bienId, bienInfo) => {
        try {
            setLoadingHistorial(true)
            setHistorialBienInfo(bienInfo)
            const { data, error } = await supabase
                .from('historial_movimientos')
                .select(`
          *,
          tipo_movimiento:tipos_movimiento(*),
          persona_origen:personas!historial_movimientos_persona_origen_id_fkey(nombres, apellidos),
          persona_destino:personas!historial_movimientos_persona_destino_id_fkey(nombres, apellidos),
          ambiente_origen:ambientes!historial_movimientos_ambiente_origen_id_fkey(nombre, area_id),
          ambiente_destino:ambientes!historial_movimientos_ambiente_destino_id_fkey(nombre, area_id)
        `)
                .eq('bien_id', bienId)
                .order('fecha_movimiento', { ascending: true })

            if (error) throw error
            setHistorialMovimientos(data || [])
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar historial'), 'error')
        } finally {
            setLoadingHistorial(false)
        }
    }

    const registrarMovimiento = async (movimiento) => {
        try {
            const { error } = await supabase
                .from('historial_movimientos')
                .insert([movimiento])
            if (error) throw error
            return true
        } catch (error) {
            console.error('[registrar movimiento] Error:', error)
            return false
        }
    }

    const handleTraslado = async () => {
        if (!trasladoData.persona_destino_id && trasladoData.tipo === 'traslado') {
            mostrarToast('Seleccione el nuevo responsable', 'error')
            return
        }
        if (!trasladoData.ambiente_destino_id && trasladoData.tipo !== 'baja') {
            mostrarToast('Seleccione la nueva ubicación', 'error')
            return
        }

        try {
            const asignacionActual = selectedAsignacion
            const motivoFinal = trasladoData.motivo === 'Otro'
                ? trasladoData.motivo_especifico
                : trasladoData.motivo

            let tipoMovimientoId = null
            let nuevoEstado = 'Activo'

            if (trasladoData.tipo === 'traslado') {
                tipoMovimientoId = 2
                nuevoEstado = 'Trasladado'
            } else if (trasladoData.tipo === 'devolucion') {
                tipoMovimientoId = 3
                nuevoEstado = 'Devuelto'
            } else if (trasladoData.tipo === 'baja') {
                tipoMovimientoId = 6
                nuevoEstado = 'Baja'
            }

            const updateData = {
                fecha_actualizacion: trasladoData.fecha,
                estado_asignacion: nuevoEstado
            }

            if (trasladoData.tipo === 'traslado') {
                updateData.persona_id = trasladoData.persona_destino_id
                updateData.ambiente_id = trasladoData.ambiente_destino_id
            } else if (trasladoData.tipo === 'devolucion') {
                const almacen = todosLosAmbientes.find(a =>
                    a.nombre === 'Almacén General' || a.tipo === 'Almacén'
                )
                if (almacen) {
                    updateData.ambiente_id = almacen.id
                }
                updateData.persona_id = null
                // Restaurar estado del bien a Activo
                await supabase.from('bienes').update({ estado: 'Activo' }).eq('id', asignacionActual.bien_id)
            } else if (trasladoData.tipo === 'baja') {
                await supabase
                    .from('bienes')
                    .update({ estado: 'Dado de Baja' })
                    .eq('id', asignacionActual.bien_id)
            }

            const { error: updateError } = await supabase
                .from('asignaciones')
                .update(updateData)
                .eq('id', asignacionActual.id)

            if (updateError) throw updateError

        const personaRegistro = trasladoData.usuario_registro
            ? personas.find(p => p.id === trasladoData.usuario_registro)
            : null
        const usuarioRegistroNombre = personaRegistro
            ? `${personaRegistro.nombres} ${personaRegistro.apellidos}`
            : null

        const movimiento = {
            bien_id: asignacionActual.bien_id,
            tipo_movimiento_id: tipoMovimientoId,
            persona_origen_id: asignacionActual.persona_id,
            persona_destino_id: trasladoData.tipo === 'traslado' ? trasladoData.persona_destino_id : null,
            ambiente_origen_id: asignacionActual.ambiente_id,
            ambiente_destino_id: trasladoData.tipo === 'devolucion'
                ? todosLosAmbientes.find(a => a.nombre === 'Almacén General')?.id
                : trasladoData.ambiente_destino_id,
            fecha_movimiento: trasladoData.fecha,
            motivo: motivoFinal,
            documento_referencia: trasladoData.documento_referencia,
            observaciones: trasladoData.observaciones,
            usuario_registro: usuarioRegistroNombre
        }

            await registrarMovimiento(movimiento)

            mostrarToast(
                trasladoData.tipo === 'traslado' ? '✅ Bien trasladado exitosamente' :
                    trasladoData.tipo === 'devolucion' ? '↩️ Bien devuelto al almacén' :
                        '⚠️ Bien dado de baja',
                'success'
            )

            setOpenTrasladoModal(false)
            resetTrasladoForm()
            cargarDatos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'trasladar bien'), 'error')
        }
    }

    const resetTrasladoForm = () => {
        setTrasladoData({
            tipo: 'traslado',
            persona_destino_id: '',
            ambiente_destino_id: '',
            motivo: '',
            motivo_especifico: '',
            documento_referencia: '',
            fecha: new Date().toISOString().split('T')[0],
            observaciones: '',
            usuario_registro: ''
        })
        setInfoNuevoResponsable(null)
        setInfoNuevoAmbiente(null)
    }

    // ==================== CRUD ASIGNACIONES ====================
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async () => {
        if (!formData.bien_id || !formData.persona_id) {
            mostrarToast('Complete los campos obligatorios', 'error')
            return
        }

        try {
            const anio = new Date().getFullYear()

            // Generar número de acta solo para nuevas asignaciones
            let numeroActa = null
            if (!editMode) {
                const { data: maxActaData } = await supabase
                    .from('asignaciones')
                    .select('numero_acta')
                    .like('numero_acta', `%-${anio}`)
                    .order('numero_acta', { ascending: false })
                    .limit(1)

                if (maxActaData && maxActaData.length > 0) {
                    const parts = maxActaData[0].numero_acta.split('-')
                    const nextNumber = (parseInt(parts[0], 10) || 0) + 1
                    numeroActa = `${String(nextNumber).padStart(4, '0')}-${anio}`
                } else {
                    numeroActa = `0001-${anio}`
                }
            }

            const payload = {
                bien_id: formData.bien_id,
                persona_id: formData.persona_id,
                ambiente_id: formData.ambiente_id || null,
                fecha_asignacion: formData.fecha_asignacion,
                observaciones: formData.observaciones,
                estado_asignacion: formData.estado_asignacion,
                ...(!editMode && numeroActa ? { numero_acta: numeroActa } : {})
            }

            if (editMode) {
                const { error } = await supabase
                    .from('asignaciones')
                    .update({ ...payload, fecha_actualizacion: new Date().toISOString().split('T')[0] })
                    .eq('id', selectedAsignacion.id)

                if (error) throw error
                mostrarToast('Asignación actualizada ✨')
            } else {
                const { error } = await supabase.from('asignaciones').insert([payload])
                if (error) throw error

                await registrarMovimiento({
                    bien_id: formData.bien_id,
                    tipo_movimiento_id: 1,
                    persona_origen_id: formData.persona_origen_id || null,
                    persona_destino_id: formData.persona_id,
                    ambiente_destino_id: formData.ambiente_id || null,
                    fecha_movimiento: formData.fecha_asignacion,
                    documento_referencia: formData.documento_referencia || null,
                    motivo: formData.motivo || null,
                    observaciones: formData.observaciones || 'Asignación inicial del bien'
                })

                // Actualizar estado del bien a Asignado
                await supabase.from('bienes').update({ estado: 'Asignado' }).eq('id', formData.bien_id)

                mostrarToast('Asignación registrada ✅')
            }

            setOpenModal(false)
            resetForm()
            cargarDatos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'guardar asignación'), 'error')
        }
    }

    const handleEdit = (asignacion) => {
        setEditMode(true)
        setSelectedAsignacion(asignacion)
        setFormData({
            bien_id: asignacion.bien_id,
            persona_id: asignacion.persona_id,
            ambiente_id: asignacion.ambiente_id || '',
            fecha_asignacion: asignacion.fecha_asignacion,
            documento_referencia: '',
            persona_origen_id: '',
            motivo: '',
            observaciones: asignacion.observaciones || '',
            estado_asignacion: asignacion.estado_asignacion || 'Activo'
        })
        if (asignacion.ambiente?.piso_id) setSelectedPiso(asignacion.ambiente.piso_id)

        // Cargar info contextual para edición
        const bienSeleccionado = bienes.find(b => b.id === asignacion.bien_id)
        if (bienSeleccionado) {
            setSearchTermBien(`${bienSeleccionado.tipo_equipo} - ${bienSeleccionado.codigo_patrimonial || 'S/C'} (${bienSeleccionado.marca || 'S/M'})`)
        }

        const personaData = personas.find(p => p.id === asignacion.persona_id)
        if (personaData) {
            setInfoResponsable({
                nombres: `${personaData.nombres} ${personaData.apellidos}`,
                dni: personaData.dni,
                cargo: personaData.cargo || 'No especificado',
                email: personaData.email || 'No registrado',
                telefono: personaData.telefono || 'No registrado'
            })
        }

        const ambienteData = todosLosAmbientes.find(a => a.id === asignacion.ambiente_id)
        if (ambienteData) {
            const cantidadBienes = asignaciones.filter(a => a.ambiente_id === ambienteData.id && a.estado_asignacion === 'Activo').length
            setInfoAmbiente({
                nombre: ambienteData.nombre,
                codigo: ambienteData.codigo,
                piso: ambienteData.piso?.nombre || `Piso ${ambienteData.piso?.numero}`,
                tipo: ambienteData.tipo || 'Oficina',
                area: ambienteData.area?.nombre || null,
                bienesOcupados: cantidadBienes
            })
        }

        setOpenModal(true)
    }

    const handleDelete = async (asignacion) => {
        if (confirm('¿Eliminar este registro?')) {
            try {
                const { error } = await supabase.from('asignaciones').delete().eq('id', asignacion.id)
                if (error) throw error

                // Si estaba activa, restaurar estado del bien
                if (asignacion.estado_asignacion === 'Activo') {
                    await supabase.from('bienes').update({ estado: 'Activo' }).eq('id', asignacion.bien_id)
                }

                mostrarToast('Registro eliminado')
                cargarDatos()
            } catch (error) {
                mostrarToast(handleApiError(error, 'eliminar asignación'), 'error')
            }
        }
    }

    const resetForm = () => {
        setEditMode(false)
        setSelectedAsignacion(null)
        setSelectedPiso('')
        setInfoResponsable(null)
        setInfoAmbiente(null)
        setSearchTermBien('')
        setShowBienDropdown(false)
        setFormData({
            bien_id: '',
            persona_id: '',
            ambiente_id: '',
            fecha_asignacion: new Date().toISOString().split('T')[0],
            documento_referencia: '',
            persona_origen_id: '',
            motivo: '',
            observaciones: '',
            estado_asignacion: 'Activo'
        })
    }

    const obtenerPisosMapa = () => {
        return pisos.map(piso => ({
            ...piso,
            ambientes: todosLosAmbientes.filter(a => a.piso_id === piso.id)
        }))
    }

    const obtenerAreasMapa = () => {
        return areas.map(area => ({
            ...area,
            ambientes: todosLosAmbientes.filter(a => a.area_id === area.id)
        }))
    }

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'Activo': return 'bg-green-50 text-green-700 border-green-200'
            case 'Trasladado': return 'bg-amber-50 text-amber-700 border-amber-200'
            case 'Devuelto': return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'Baja': return 'bg-red-50 text-red-700 border-red-200'
            default: return 'bg-slate-100 text-slate-600'
        }
    }

    const getCondicionBadge = (condicion) => {
        switch (condicion) {
            case 'Bueno': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Bueno</span>
            case 'Regular': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Regular</span>
            case 'Malo': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Malo</span>
            case 'Chatarra': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Chatarra</span>
            default: return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{condicion || '—'}</span>
        }
    }

    const getEstadoBienBadge = (estado) => {
        switch (estado) {
            case 'Activo': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Disponible</span>
            case 'Asignado': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Asignado</span>
            default: return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{estado}</span>
        }
    }

    // ==================== RENDER ====================
    return (
        <div className="p-1 space-y-6 max-w-[1600px] mx-auto font-sans antialiased text-slate-900">
            <Toaster />

            {/* ENCABEZADO */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                        Gestión de Asignaciones
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">Trazabilidad de bienes patrimoniales distribuidos por personal y ambientes físicos</p>
                </div>
                {activeTab !== 'toners' && (
                    <Button appearance="primary" icon={<AddRegular />} onClick={() => { resetForm(); setOpenModal(true) }}>
                        Nueva Asignación
                    </Button>
                )}
            </div>



            {/* TABS DE NAVEGACIÓN INTERNA */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('lista')}
                        className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${activeTab === 'lista'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <TableRegular />
                            <span>Lista de Asignaciones</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('mapa')}
                        className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${activeTab === 'mapa'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <BuildingRegular />
                            <span>Distribución por Ubicación</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('toners')}
                        className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${activeTab === 'toners'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <CartRegular />
                            <span>🧴 Consumibles (Tóner)</span>
                        </div>
                    </button>
                </nav>
            </div>

            {/* CONTENIDO SEGÚN TAB ACTIVA */}
            {activeTab === 'lista' ? (
                <>
                    {/* FILTROS AVANZADOS */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                        {/* ... contenido de filtros existente ... */}
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <SearchRegular className="text-blue-500" /> Filtros Avanzados
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input type="date" placeholder="Desde" value={filtros.fechaInicio} onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })} className="text-xs border rounded-lg px-3 py-2" />
                            <input type="date" placeholder="Hasta" value={filtros.fechaFin} onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })} className="text-xs border rounded-lg px-3 py-2" />
                            <select value={filtros.tipoBien} onChange={(e) => setFiltros({ ...filtros, tipoBien: e.target.value })} className="text-xs border rounded-lg px-3 py-2">
                                <option value="">Todos los tipos</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Desktop">Desktop</option>
                                <option value="Proyector">Proyector</option>
                                <option value="Impresora">Impresora</option>
                            </select>
                            <select value={filtros.estadoFiltro} onChange={(e) => setFiltros({ ...filtros, estadoFiltro: e.target.value })} className="text-xs border rounded-lg px-3 py-2">
                                <option value="">Todos los estados</option>
                                <option value="Activo">Activo</option>
                                <option value="Trasladado">Trasladado</option>
                                <option value="Devuelto">Devuelto</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>
                    </div>

                    {/* BARRA DE ACCIONES */}
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
                        {/* ... contenido de acciones existente ... */}
                        <div className="relative flex-1 w-full">
                            <SearchRegular className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Buscar por equipo, código, responsable..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-xs border rounded-lg" />
                        </div>
                        <div className="flex gap-2">
                            <Button size="small" icon={<DocumentPdfRegular />} onClick={exportarAPdf} disabled={exportandoPdf}>PDF</Button>
                            <Button size="small" icon={<ArrowSyncRegular />} onClick={exportarAExcel} disabled={exportando}>Excel</Button>
                            <Button size="small" icon={<HistoryRegular />} onClick={generarReportePorPeriodo}>Reporte</Button>
                            <Button size="small" icon={<ArrowSyncRegular />} onClick={cargarDatos}>Sync</Button>
                        </div>
                    </div>

                    {/* TABLA PRINCIPAL */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* ... tabla existente ... */}
                        {loading ? (
                            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3.5">Bien</th>
                                            <th className="px-6 py-3.5">Código</th>
                                            <th className="px-6 py-3.5">N° Acta</th>
                                            <th className="px-6 py-3.5">Responsable</th>
                                            <th className="px-6 py-3.5">Ubicación</th>
                                            <th className="px-6 py-3.5">Fecha</th>
                                            <th className="px-6 py-3.5">Estado</th>
                                            <th className="px-6 py-3.5 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-xs">
                                        {asignacionesFiltradasAvanzado.map((asig) => (
                                            <tr key={asig.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-3.5 font-semibold">
                                                    {asig.bien?.tipo_equipo}
                                                    <div className="text-[10px] text-gray-400">{asig.bien?.marca} {asig.bien?.modelo}</div>
                                                </td>
                                                <td className="px-6 py-3.5 font-mono text-xs">{asig.bien?.codigo_patrimonial}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs text-blue-700">{asig.numero_acta || '—'}</td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => verBienesPorPersona(asig.persona_id, asig.persona?.nombres, asig.persona?.apellidos)}>
                                                        <PersonRegular className="text-gray-400" />
                                                        <span className="hover:text-blue-600 hover:underline">{asig.persona?.apellidos}, {asig.persona?.nombres}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">{asig.ambiente?.nombre || 'Almacén'}</td>
                                                <td className="px-6 py-3.5">{asig.fecha_asignacion}</td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getEstadoColor(asig.estado_asignacion)}`}>
                                                        {asig.estado_asignacion}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex gap-1 justify-center">
                                                        <Tooltip content="Ver bienes"><Button size="small" appearance="subtle" icon={<EyeRegular />} onClick={() => verBienesPorPersona(asig.persona_id, asig.persona?.nombres, asig.persona?.apellidos)} /></Tooltip>
                                                        <Tooltip content="Acta cargo"><Button size="small" appearance="subtle" icon={<DocumentPdfRegular />} className="text-green-600" onClick={() => generarActaCargo(asig.persona_id, asig.persona?.nombres, asig.persona?.apellidos, asig.persona)} /></Tooltip>
                                                        <Tooltip content="Trasladar"><Button size="small" appearance="subtle" icon={<ArrowSwapRegular />} onClick={() => { setSelectedAsignacion(asig); setOpenTrasladoModal(true) }} /></Tooltip>
                                                        <Tooltip content="Historial"><Button size="small" appearance="subtle" icon={<HistoryRegular />} onClick={() => { cargarHistorialMovimientos(asig.bien_id, asig.bien); setOpenHistorialModal(true) }} /></Tooltip>
                                                        {asig.acta_url ? (
                                                            <Tooltip content="Ver Acta">
                                                                <a href={asig.acta_url} target="_blank" rel="noopener noreferrer">
                                                                    <Button size="small" appearance="subtle" icon={<EyeRegular />} className="text-blue-600" />
                                                                </a>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip content="Generar Acta">
                                                                <Button size="small" appearance="subtle" icon={<DocumentPdfRegular />} className="text-red-600" onClick={() => generarActaAsignacion(asig)} />
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip content="Editar"><Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => handleEdit(asig)} /></Tooltip>
                                                        <Tooltip content="Eliminar"><Button size="small" appearance="subtle" icon={<DeleteRegular />} className="text-red-500" onClick={() => handleDelete(asig)} /></Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : activeTab === 'mapa' ? (
                <>
                    {/* MAPA DE UBICACIONES */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-gray-400">
                                <BuildingRegular className="text-blue-600 text-lg" />
                                Distribución por Ubicación (Click para ver bienes)
                            </h2>
                            <Badge appearance="filled" color="brand">
                                {todosLosAmbientes.length} ambientes
                            </Badge>
                        </div>

                        {/* SUB-TABS */}
                        <div className="flex gap-1 mb-4 border-b border-gray-200">
                            <button
                                onClick={() => setDistribucionVista('piso')}
                                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-all ${distribucionVista === 'piso'
                                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <BuildingRegular style={{ fontSize: '14px' }} className="inline mr-1" />
                                Por Piso
                            </button>
                            <button
                                onClick={() => setDistribucionVista('area')}
                                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-all ${distribucionVista === 'area'
                                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                📋 Por Área
                            </button>
                        </div>

                        {distribucionVista === 'piso' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {obtenerPisosMapa().map((piso) => (
                                    <div key={piso.id} className="bg-slate-50/60 rounded-xl border border-slate-200/60 overflow-hidden flex flex-col">
                                        <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center">
                                            <span className="text-xs font-bold font-mono">{piso.nombre || `PISO ${piso.numero}`}</span>
                                            {piso.numero === 0 && <Badge appearance="filled" color="warning">Almacén</Badge>}
                                        </div>
                                        <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto">
                                            {piso.ambientes.map((ambiente) => {
                                                const cantidad = asignaciones.filter(a => a.ambiente_id === ambiente.id && a.estado_asignacion === 'Activo').length
                                                return (
                                                    <div
                                                        key={ambiente.id}
                                                        className="bg-white p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                                                        onClick={() => verBienesPorUbicacion(ambiente.id)}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs font-semibold text-slate-800">{ambiente.nombre}</p>
                                                            <Badge appearance={cantidad > 0 ? "filled" : "outline"} color={cantidad > 0 ? "brand" : "neutral"}>
                                                                {cantidad} bienes
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[10px] font-mono text-gray-400 mt-1">{ambiente.codigo}</p>
                                                        {ambiente.area && (
                                                            <p className="text-[10px] text-blue-600 mt-0.5">{ambiente.area.nombre}</p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {obtenerAreasMapa().map((area) => (
                                    <div key={area.id} className="bg-slate-50/60 rounded-xl border border-slate-200/60 overflow-hidden flex flex-col">
                                        <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-4 py-2.5 flex justify-between items-center">
                                            <span className="text-xs font-bold font-mono">{area.nombre}</span>
                                            <Badge appearance="filled" color="neutral">
                                                {area.ambientes.length} ambientes
                                            </Badge>
                                        </div>
                                        <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto">
                                            {area.ambientes.map((ambiente) => {
                                                const cantidad = asignaciones.filter(a => a.ambiente_id === ambiente.id && a.estado_asignacion === 'Activo').length
                                                return (
                                                    <div
                                                        key={ambiente.id}
                                                        className="bg-white p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                                                        onClick={() => verBienesPorUbicacion(ambiente.id)}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs font-semibold text-slate-800">{ambiente.nombre}</p>
                                                            <Badge appearance={cantidad > 0 ? "filled" : "outline"} color={cantidad > 0 ? "brand" : "neutral"}>
                                                                {cantidad} bienes
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[10px] font-mono text-gray-400 mt-1">{ambiente.codigo}</p>
                                                        {ambiente.piso && (
                                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                                <BuildingRegular style={{ fontSize: '11px' }} className="inline mr-0.5" />
                                                                {ambiente.piso.nombre || `Piso ${ambiente.piso.numero}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TARJETAS ESTADÍSTICAS */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Total</p>
                            <p className="text-2xl font-bold">{estadisticas.totalAsignaciones}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Activos</p>
                            <p className="text-2xl font-bold">{estadisticas.activos}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Trasladados</p>
                            <p className="text-2xl font-bold">{estadisticas.trasladados}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Devueltos</p>
                            <p className="text-2xl font-bold">{estadisticas.devueltos}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Baja</p>
                            <p className="text-2xl font-bold">{estadisticas.baja}</p>
                        </div>
                        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Almacén</p>
                            <p className="text-2xl font-bold">{estadisticas.enAlmacen}</p>
                        </div>
                    </div>


                </>
            ) : (
                /* TAB DE CONSUMIBLES (TÓNER) */
                <GestionToners />
            )}


















            {/* ==================== DRAWER - NUEVA ASIGNACIÓN MEJORADO ==================== */}
            <Drawer position="end" open={openModal} onOpenChange={(_, data) => setOpenModal(data.open)} size='medium'>
                <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                    <DrawerHeaderTitle
                        action={
                            <Button appearance="subtle" icon={<DismissRegular />} onClick={() => {
                                setOpenModal(false)
                                resetForm()
                                setSearchTermBien('')
                            }} />
                        }
                    >
                        <div>
                            <span className="text-lg font-bold text-slate-800">
                                {editMode ? '✏️ Editar Asignación' : '📝 Nueva Asignación'}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">Complete los datos del bien y el servidor responsable</p>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>

                <DrawerBody className="space-y-5 p-6">

                    {/* BIEN PATRIMONIAL CON BÚSQUEDA */}
                    <Field label="Bien Patrimonial *" required>
                        <div className="relative">
                            <div className="relative">
                                <SearchRegular className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar por tipo, marca, modelo, código patrimonial o serie..."
                                    value={searchTermBien}
                                    onChange={(e) => {
                                        setSearchTermBien(e.target.value)
                                        setShowBienDropdown(true)
                                    }}
                                    onFocus={() => setShowBienDropdown(true)}
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {showBienDropdown && bienesFiltrados.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {bienesFiltrados.map(b => (
                            <div
                                key={b.id}
                                className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors"
                                onClick={() => {
                                    setFormData({ ...formData, bien_id: b.id })
                                    setSearchTermBien(`${b.tipo_equipo} - ${b.codigo_patrimonial || 'S/C'} (${b.marca || 'S/M'})`)
                                    setShowBienDropdown(false)
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm">{b.tipo_equipo}</span>
                                            <Badge appearance="outline" color="brand" size="small">
                                                {b.codigo_patrimonial || 'S/C'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {b.marca} {b.modelo}
                                        </p>
                                        <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                                            <span>🔢 Serie: {b.serie || 'N/A'}</span>
                                            <span>🏷️ Código TI: {b.codigo_ti || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2 flex flex-col items-end gap-1">
                                        {getEstadoBienBadge(b.estado)}
                                        {getCondicionBadge(b.condicion)}
                                    </div>
                                </div>
                            </div>
                        ))}
                                </div>
                            )}

                            {showBienDropdown && bienesFiltrados.length === 0 && searchTermBien && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                                    No se encontraron bienes con: "{searchTermBien}"
                                </div>
                            )}

                            {/* Mostrar bien seleccionado */}
                    {formData.bien_id && !showBienDropdown && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold text-blue-800">✅ Bien seleccionado</span>
                                            <Badge appearance="filled" color="brand" size="small">
                                                {bienes.find(b => b.id === formData.bien_id)?.codigo_patrimonial || 'S/C'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800 mt-1">
                                            {bienes.find(b => b.id === formData.bien_id)?.tipo_equipo}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {bienes.find(b => b.id === formData.bien_id)?.marca} {bienes.find(b => b.id === formData.bien_id)?.modelo}
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] text-gray-400">Serie: {bienes.find(b => b.id === formData.bien_id)?.serie || 'N/A'}</span>
                                            {getCondicionBadge(bienes.find(b => b.id === formData.bien_id)?.condicion)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setFormData({ ...formData, bien_id: '' })
                                            setSearchTermBien('')
                                        }}
                                        className="text-xs text-red-500 hover:text-red-700 underline"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            </div>
                        )}
                        </div>
                    </Field>

                    {/* RESPONSABLE */}
                    <Field label="Servidor Público Responsable *" required>
                        <select
                            name="persona_id"
                            value={formData.persona_id}
                            onChange={handlePersonaChange}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Seleccionar Responsable --</option>
                            {personas.map(p => (
                                <option key={p.id} value={p.id}>
                                    👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {/* Tarjeta de información del responsable */}
                    {infoResponsable && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <PersonRegular className="text-blue-600 text-sm" />
                                <span className="text-xs font-semibold text-blue-800">Información del Responsable</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-[10px] text-gray-500">Nombre completo</p>
                                    <p className="font-medium text-gray-800">{infoResponsable.nombres}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500">DNI</p>
                                    <p className="font-mono font-medium">{infoResponsable.dni}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500">Cargo</p>
                                    <p className="font-medium">{infoResponsable.cargo}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500">Contacto</p>
                                    <p className="text-xs">{infoResponsable.email} | {infoResponsable.telefono}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UBICACIÓN */}
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Piso / Nivel">
                            <select
                                value={selectedPiso}
                                onChange={(e) => setSelectedPiso(e.target.value)}
                                className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                            >
                                <option value="">-- Todos los pisos --</option>
                                {pisos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        🏢 {p.nombre || `Piso ${p.numero}`}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Ambiente / Oficina">
                            <select
                                name="ambiente_id"
                                value={formData.ambiente_id}
                                onChange={handleAmbienteChange}
                                className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                            >
                                <option value="">-- Seleccionar Ambiente --</option>
                                {(selectedPiso ? ambientesFiltrados : todosLosAmbientes).map(a => (
                                    <option key={a.id} value={a.id}>
                                        📍 {a.nombre} ({a.codigo})
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    {/* Tarjeta de información del ambiente */}
                    {infoAmbiente && (
                        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-3 border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <BuildingRegular className="text-green-600 text-sm" />
                                <span className="text-xs font-semibold text-green-800">Información de la Ubicación</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-[10px] text-gray-500">Ambiente</p>
                                    <p className="font-medium text-gray-800">{infoAmbiente.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500">Código</p>
                                    <p className="font-mono font-medium">{infoAmbiente.codigo}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500">Ubicación</p>
                                    <p className="font-medium">{infoAmbiente.piso}</p>
                                </div>
                                {infoAmbiente.area && (
                                    <div>
                                        <p className="text-[10px] text-gray-500">Área</p>
                                        <p className="font-medium text-blue-700">{infoAmbiente.area}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] text-gray-500">Bienes ocupados</p>
                                    <p className={`font-medium ${infoAmbiente.bienesOcupados > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                        {infoAmbiente.bienesOcupados} equipos
                                    </p>
                                </div>
                            </div>
                            {infoAmbiente.bienesOcupados > 0 && (
                                <div className="mt-2 pt-2 border-t border-green-100 text-[11px] text-amber-600 flex items-center gap-1">
                                    <WarningRegular className="text-amber-500 text-xs" />
                                    ⚠️ Este ambiente ya tiene {infoAmbiente.bienesOcupados} bienes asignados
                                </div>
                            )}
                        </div>
                    )}

                    {/* FECHA */}
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

                        {editMode && (
                            <Field label="Estado Actual">
                                <select
                                    name="estado_asignacion"
                                    value={formData.estado_asignacion}
                                    onChange={handleInputChange}
                                    className="w-full text-sm border rounded-lg px-3 py-2.5"
                                >
                                    <option value="Activo">✅ Activo</option>
                                    <option value="Trasladado">🔄 Trasladado</option>
                                    <option value="Devuelto">↩️ Devuelto</option>
                                    <option value="Baja">⚠️ Dado de Baja</option>
                                </select>
                            </Field>
                        )}
                    </div>

                    {/* DOCUMENTO DE REFERENCIA */}
                    <Field label="Documento de referencia">
                        <input
                            type="text"
                            name="documento_referencia"
                            value={formData.documento_referencia}
                            onChange={handleInputChange}
                            placeholder="Ej. Memorando N° 001-2025, Resolución Directoral..."
                            className="w-full text-sm border rounded-lg px-3 py-2.5"
                        />
                    </Field>

                    {/* ASIGNADO POR */}
                    <Field label="Asignado por / Entregado por">
                        <select
                            name="persona_origen_id"
                            value={formData.persona_origen_id}
                            onChange={handleInputChange}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Seleccionar --</option>
                            {(() => {
                                const areaInformatica = areas.find(a => a.nombre?.toLowerCase() === 'informática')
                                const filtradas = areaInformatica
                                    ? personas.filter(p => p.area_id === areaInformatica.id)
                                    : personas
                                return filtradas.map(p => (
                                    <option key={p.id} value={p.id}>
                                        👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                                    </option>
                                ))
                            })()}
                        </select>
                    </Field>

                    {/* MOTIVO DE ASIGNACIÓN */}
                    <Field label="Motivo de asignación">
                        <select
                            name="motivo"
                            value={formData.motivo}
                            onChange={handleInputChange}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Seleccionar motivo --</option>
                            <option value="Asignación por cargo">👔 Asignación por cargo</option>
                            <option value="Nueva contratación">🆕 Nueva contratación</option>
                            <option value="Reemplazo de equipo">🔄 Reemplazo de equipo</option>
                            <option value="Asignación temporal">⏱️ Asignación temporal</option>
                            <option value="Inventario inicial">📋 Inventario inicial</option>
                            <option value="Otro">📝 Otro</option>
                        </select>
                    </Field>

                    {/* OBSERVACIONES */}
                    <Field label="Observaciones">
                        <textarea
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleInputChange}
                            rows="3"
                            placeholder="Ej. Bien asignado para uso administrativo, incluye cargador y funda..."
                            className="w-full text-sm border rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500"
                        />
                    </Field>

                    {/* RESUMEN */}
                    {formData.bien_id && formData.persona_id && (
                        <div className="bg-slate-100 rounded-xl p-4 mt-2">
                            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <CheckmarkCircleRegular className="text-green-600" />
                                Resumen de la Asignación
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <div className="flex items-center gap-1">🔹 <span className="font-medium">Bien:</span> {bienes.find(b => b.id === formData.bien_id)?.tipo_equipo}</div>
                                <div className="flex items-center gap-1">🔹 <span className="font-medium">Código:</span> {bienes.find(b => b.id === formData.bien_id)?.codigo_patrimonial || 'N/A'}</div>
                                <div className="flex items-center gap-1">🔹 <span className="font-medium">Responsable:</span> {personas.find(p => p.id === formData.persona_id)?.apellidos}</div>
                                <div className="flex items-center gap-1">🔹 <span className="font-medium">Ubicación:</span> {todosLosAmbientes.find(a => a.id === formData.ambiente_id)?.nombre || 'Pendiente'}</div>
                                <div className="flex items-center gap-1 col-span-2">🔹 <span className="font-medium">Fecha:</span> {formData.fecha_asignacion}</div>
                            </div>
                        </div>
                    )}
                </DrawerBody>

                <DrawerFooter className="border-t pt-4 pb-4 bg-gray-50 flex justify-end gap-3">
                    <Button appearance="secondary" onClick={() => {
                        setOpenModal(false)
                        resetForm()
                        setSearchTermBien('')
                    }}>
                        Cancelar
                    </Button>
                    <Button appearance="primary" icon={<CheckmarkCircleRegular />} onClick={handleSubmit}>
                        {editMode ? 'Actualizar Asignación' : 'Confirmar Asignación'}
                    </Button>
                </DrawerFooter>
            </Drawer>

            {/* DRAWER - DETALLE DE BIENES POR PERSONA/UBICACIÓN */}
            <Drawer position="end" open={openDetalleModal} onOpenChange={(_, data) => setOpenDetalleModal(data.open)} size='medium'>
                <DrawerHeader className="border-b bg-gradient-to-r from-indigo-50 to-white">
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenDetalleModal(false)} />}>
                        <div>
                            <span className="text-lg font-bold text-slate-800">
                                {selectedPersonaDetalle?.esUbicacion ? '📍 Bienes por Ubicación' : '👤 Bienes Asignados'}
                            </span>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody className="p-6 my-6">
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">{selectedPersonaDetalle?.esUbicacion ? 'Ubicación' : 'Responsable'}</p>
                        <p className="text-lg font-bold text-gray-800">{selectedPersonaDetalle?.nombre}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                            {selectedPersonaDetalle?.esUbicacion && selectedPersonaDetalle?.ambienteData && (
                                <>
                                    {selectedPersonaDetalle.ambienteData.piso && (
                                        <span className="flex items-center gap-1">
                                            <BuildingRegular style={{ fontSize: '12px' }} className="text-gray-400" />
                                            {selectedPersonaDetalle.ambienteData.piso.nombre || `Piso ${selectedPersonaDetalle.ambienteData.piso.numero}`}
                                        </span>
                                    )}
                                    {selectedPersonaDetalle.ambienteData.area && (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                            {selectedPersonaDetalle.ambienteData.area.nombre}
                                        </span>
                                    )}
                                </>
                            )}
                            <span>Total: {bienesPorPersona.length} bienes</span>
                        </div>
                    </div>
                    {bienesPorPersona.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No hay bienes asignados</div>
                    ) : (
                        <div className="space-y-3">
                            {bienesPorPersona.map((asig) => (
                                <div key={asig.id} className="bg-slate-50 rounded-xl p-4 border hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">{asig.bien?.tipo_equipo}</p>
                                            <p className="text-xs text-gray-500">{asig.bien?.marca} {asig.bien?.modelo}</p>
                                            <p className="text-xs font-mono text-gray-400 mt-1">Código: {asig.bien?.codigo_patrimonial}</p>
                                        </div>
                                        <Badge appearance="filled" color="success">{asig.estado_asignacion}</Badge>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                                        <span>📍 {asig.ambiente?.nombre}</span>
                                        <span>📅 {asig.fecha_asignacion}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DrawerBody>
                <DrawerFooter className="border-t pt-4 pb-4 bg-gray-50">
                    {!selectedPersonaDetalle?.esUbicacion && (
                        <Button appearance="primary" icon={<DocumentPdfRegular />} onClick={() => generarActaCargo(selectedPersonaDetalle?.id, selectedPersonaDetalle?.nombre?.split(' ')[0], selectedPersonaDetalle?.nombre?.split(' ')[1] || '', personas.find(p => p.id === selectedPersonaDetalle?.id))} disabled={bienesPorPersona.length === 0}>
                            Generar Acta de Cargo
                        </Button>
                    )}
                </DrawerFooter>
            </Drawer>

            {/* DRAWER - TRASLADO MEJORADO */}
            <Drawer position="end" open={openTrasladoModal} onOpenChange={(_, data) => setOpenTrasladoModal(data.open)} size='medium'>
                <DrawerHeader className="border-b bg-gradient-to-r from-amber-50 to-white">
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => { setOpenTrasladoModal(false); resetTrasladoForm() }} />}>
                        <div>
                            <span className="text-lg font-bold text-slate-800">🔄 Trasladar Bien Patrimonial</span>
                            <p className="text-xs text-gray-500 mt-0.5">Complete los datos del nuevo responsable y ubicación</p>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>

                <DrawerBody className="space-y-5 p-6 my-6">
                    {/* Información del bien */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            <BoxRegular className="text-blue-600" />
                            Bien a trasladar
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-500">Tipo de Equipo</p>
                                <p className="font-semibold text-gray-800">{selectedAsignacion?.bien?.tipo_equipo}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Código Patrimonial</p>
                                <p className="font-mono text-sm font-medium text-blue-700">{selectedAsignacion?.bien?.codigo_patrimonial || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Marca / Modelo</p>
                                <p className="text-sm">{selectedAsignacion?.bien?.marca} {selectedAsignacion?.bien?.modelo}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Número de Serie</p>
                                <p className="text-xs font-mono">{selectedAsignacion?.bien?.serie || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Información actual */}
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-800 mb-2">📍 Situación actual</p>
                        <p className="text-sm">Responsable: <span className="font-medium">{selectedAsignacion?.persona?.apellidos}, {selectedAsignacion?.persona?.nombres}</span></p>
                        <p className="text-sm">Ubicación: {selectedAsignacion?.ambiente?.nombre} ({selectedAsignacion?.ambiente?.piso?.nombre || `Piso ${selectedAsignacion?.ambiente?.piso?.numero}`})</p>
                    </div>

                    {/* Nuevo responsable */}
                    <Field label="Nuevo Responsable *" required>
                        <select
                            value={trasladoData.persona_destino_id}
                            onChange={handleNuevoResponsableChange}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Seleccionar nuevo responsable --</option>
                            {personas.filter(p => p.id !== selectedAsignacion?.persona_id).map(p => (
                                <option key={p.id} value={p.id}>
                                    👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {/* Información del nuevo responsable */}
                    {infoNuevoResponsable && trasladoData.persona_destino_id && (
                        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                            <p className="text-xs font-semibold text-green-800">✅ Nuevo responsable</p>
                            <p className="text-sm">{infoNuevoResponsable.nombres}</p>
                            <p className="text-xs text-gray-500">DNI: {infoNuevoResponsable.dni} | {infoNuevoResponsable.cargo}</p>
                        </div>
                    )}

                    {/* Nueva ubicación */}
                    <Field label="Nueva Ubicación *" required>
                        <select
                            value={trasladoData.ambiente_destino_id}
                            onChange={handleNuevoAmbienteChange}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Seleccionar nueva ubicación --</option>
                            {todosLosAmbientes.map(a => (
                                <option key={a.id} value={a.id}>
                                    📍 {a.nombre} ({a.piso?.nombre || `Piso ${a.piso?.numero}`})
                                </option>
                            ))}
                        </select>
                    </Field>

                    {/* Información nueva ubicación */}
                    {infoNuevoAmbiente && trasladoData.ambiente_destino_id && (
                        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                            <p className="text-xs font-semibold text-green-800">✅ Nueva ubicación</p>
                            <p className="text-sm">{infoNuevoAmbiente.nombre}</p>
                            <p className="text-xs text-gray-500">Código: {infoNuevoAmbiente.codigo} | {infoNuevoAmbiente.piso}</p>
                        </div>
                    )}

                    {/* Motivo y documentos */}
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Motivo del Traslado *">
                            <select
                                value={trasladoData.motivo}
                                onChange={(e) => setTrasladoData({ ...trasladoData, motivo: e.target.value })}
                                className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                            >
                                <option value="">-- Seleccionar motivo --</option>
                                <option value="Reasignación de funciones">🔄 Reasignación de funciones</option>
                                <option value="Rotación de personal">🔄 Rotación de personal</option>
                                <option value="Mantenimiento del equipo">🔧 Mantenimiento del equipo</option>
                                <option value="Cambio de área">📁 Cambio de área</option>
                                <option value="Préstamo temporal">⏱️ Préstamo temporal</option>
                                <option value="Otro">📝 Otro</option>
                            </select>
                        </Field>

                        <Field label="Fecha del traslado">
                            <input
                                type="date"
                                value={trasladoData.fecha}
                                onChange={(e) => setTrasladoData({ ...trasladoData, fecha: e.target.value })}
                                className="w-full text-sm border rounded-lg px-3 py-2.5"
                            />
                        </Field>
                    </div>

                    {trasladoData.motivo === 'Otro' && (
                        <Field label="Especificar motivo">
                            <input
                                type="text"
                                placeholder="Describa el motivo del traslado..."
                                value={trasladoData.motivo_especifico}
                                onChange={(e) => setTrasladoData({ ...trasladoData, motivo_especifico: e.target.value })}
                                className="w-full text-sm border rounded-lg px-3 py-2.5"
                            />
                        </Field>
                    )}

                    <Field label="Documento de referencia">
                        <input
                            type="text"
                            placeholder="Ej. Memorando N° 001-2024, Resolución..."
                            value={trasladoData.documento_referencia}
                            onChange={(e) => setTrasladoData({ ...trasladoData, documento_referencia: e.target.value })}
                            className="w-full text-sm border rounded-lg px-3 py-2.5"
                        />
                    </Field>

                    <Field label="Registrado por">
                        <select
                            value={trasladoData.usuario_registro}
                            onChange={(e) => setTrasladoData({ ...trasladoData, usuario_registro: e.target.value })}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                        >
                            <option value="">-- Seleccionar responsable del registro --</option>
                            {personas.map(p => (
                                <option key={p.id} value={p.id}>
                                    👤 {p.apellidos}, {p.nombres} - {p.cargo || 'Personal'}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Observaciones">
                        <textarea
                            rows="3"
                            placeholder="Notas adicionales sobre el traslado..."
                            value={trasladoData.observaciones}
                            onChange={(e) => setTrasladoData({ ...trasladoData, observaciones: e.target.value })}
                            className="w-full text-sm border rounded-lg px-3 py-2.5 resize-none"
                        />
                    </Field>
                </DrawerBody>

                <DrawerFooter className="border-t pt-4 pb-4 bg-gray-50 flex justify-end gap-3">
                    <Button appearance="secondary" onClick={() => { setOpenTrasladoModal(false); resetTrasladoForm() }}>Cancelar</Button>
                    <Button appearance="primary" onClick={handleTraslado}>Confirmar Traslado</Button>
                </DrawerFooter>
            </Drawer>

            {/* DRAWER - HISTORIAL */}
            <Drawer position="end" open={openHistorialModal} onOpenChange={(_, data) => setOpenHistorialModal(data.open)} size='medium'>
                <DrawerHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenHistorialModal(false)} />}>
                        <div className="flex items-center gap-3">
                            {historialBienInfo && (
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                    <BoxRegular className="text-purple-600" style={{ fontSize: '20px' }} />
                                </div>
                            )}
                            <div>
                                <span className="text-lg font-bold text-slate-800">
                                    {historialBienInfo ? `${historialBienInfo.tipo_equipo || 'Bien'}` : 'Historial de Movimientos'}
                                </span>
                                {historialBienInfo && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {historialBienInfo.marca && historialBienInfo.modelo
                                            ? `${historialBienInfo.marca} ${historialBienInfo.modelo}`
                                            : historialBienInfo.marca || historialBienInfo.modelo || ''}
                                        {historialBienInfo.codigo_patrimonial && ` · ${historialBienInfo.codigo_patrimonial}`}
                                        {historialBienInfo.serie && ` · S/N: ${historialBienInfo.serie}`}
                                    </p>
                                )}
                                {!historialBienInfo && <p className="text-xs text-gray-500 mt-0.5">Trazabilidad completa del bien</p>}
                            </div>
                        </div>
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody className="p-0">
                    {loadingHistorial ? (
                        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : historialMovimientos.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No hay movimientos registrados para este bien</div>
                    ) : (
                        <div className="relative px-6 py-6">
                            {historialMovimientos.map((mov, index) => {
                                const tipo = mov.tipo_movimiento?.nombre || ''
                                const esActual = index === historialMovimientos.length - 1

                                const config = {
                                    Asignación: { icon: CheckmarkCircleRegular, bg: 'bg-green-500', line: 'border-green-300', label: 'Asignación', labelBg: 'bg-green-100 text-green-800' },
                                    Traslado: { icon: ArrowSwapRegular, bg: 'bg-blue-500', line: 'border-blue-300', label: 'Traslado', labelBg: 'bg-blue-100 text-blue-800' },
                                    Devolución: { icon: ArrowReplyRegular, bg: 'bg-amber-500', line: 'border-amber-300', label: 'Devolución', labelBg: 'bg-amber-100 text-amber-800' },
                                    Baja: { icon: WarningRegular, bg: 'bg-red-500', line: 'border-red-300', label: 'Baja', labelBg: 'bg-red-100 text-red-800' },
                                }
                                const cfg = config[tipo] || { icon: HistoryRegular, bg: 'bg-gray-500', line: 'border-gray-300', label: tipo || 'Movimiento', labelBg: 'bg-gray-100 text-gray-800' }
                                const Icon = cfg.icon

                                return (
                                    <div key={mov.id} className="relative flex gap-5 pb-8 last:pb-0">
                                        {index < historialMovimientos.length - 1 && (
                                            <div className={`absolute left-[17px] top-8 bottom-0 w-0.5 bg-gray-200 ${index === 0 ? 'h-full' : ''}`}></div>
                                        )}
                                        <div className="flex flex-col items-center shrink-0 pt-1">
                                            <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center text-white shadow-md ring-2 ring-white ${esActual ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}>
                                                <Icon style={{ fontSize: '16px' }} />
                                            </div>
                                        </div>
                                        <div className={`flex-1 bg-white rounded-xl border p-4 shadow-sm ${esActual ? 'ring-1 ring-blue-300 border-blue-200' : 'border-gray-100'}`}>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.labelBg}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {esActual && (
                                                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                                            Actual
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 shrink-0">
                                                    <CalendarRegular style={{ fontSize: '12px' }} /> {mov.fecha_movimiento}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                {mov.persona_origen && (
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <PersonRegular style={{ fontSize: '14px' }} className="text-gray-400 shrink-0" />
                                                        <span className="text-xs text-gray-400 font-medium">De:</span>
                                                        <span className="text-gray-700">{mov.persona_origen.nombres} {mov.persona_origen.apellidos}</span>
                                                        {mov.ambiente_origen && (
                                                            <span className="text-xs text-gray-400">
                                                                ({mov.ambiente_origen.nombre}
                                                                {(() => {
                                                                    const a = areas.find(x => x.id === mov.ambiente_origen.area_id)
                                                                    return a ? <span className="text-blue-500"> — {a.nombre}</span> : null
                                                                })()})
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {mov.persona_destino && (
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <ArrowSwapRegular style={{ fontSize: '14px' }} className="text-blue-500 shrink-0" />
                                                        <span className="text-xs text-blue-600 font-medium">A:</span>
                                                        <span className="text-gray-700 font-medium">{mov.persona_destino.nombres} {mov.persona_destino.apellidos}</span>
                                                        {mov.ambiente_destino && (
                                                            <span className="text-xs text-gray-400">
                                                                ({mov.ambiente_destino.nombre}
                                                                {(() => {
                                                                    const a = areas.find(x => x.id === mov.ambiente_destino.area_id)
                                                                    return a ? <span className="text-blue-500"> — {a.nombre}</span> : null
                                                                })()})
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {!mov.persona_origen && mov.ambiente_destino && (
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <LocationRegular style={{ fontSize: '14px' }} className="text-gray-400 shrink-0" />
                                                        <span className="text-xs text-gray-400 font-medium">Ubicación:</span>
                                                        <span className="text-gray-700">{mov.ambiente_destino.nombre}
                                                            {(() => {
                                                                const a = areas.find(x => x.id === mov.ambiente_destino.area_id)
                                                                return a ? <span className="text-blue-500"> — {a.nombre}</span> : null
                                                            })()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {(mov.motivo || mov.documento_referencia || mov.observaciones) && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                                                    {mov.motivo && (
                                                        <p className="text-xs text-gray-500">
                                                            <span className="font-medium text-gray-400">Motivo:</span> {mov.motivo}
                                                        </p>
                                                    )}
                                                    {mov.documento_referencia && (
                                                        <p className="text-xs text-blue-600 flex items-center gap-1">
                                                            <DocumentPdfRegular style={{ fontSize: '12px' }} /> {mov.documento_referencia}
                                                        </p>
                                                    )}
                                                    {mov.observaciones && (
                                                        <p className="text-xs text-gray-400 italic">{mov.observaciones}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </DrawerBody>
                <DrawerFooter className="border-t pt-4 pb-4 bg-gray-50">
                    <Button appearance="secondary" onClick={() => setOpenHistorialModal(false)}>Cerrar</Button>
                </DrawerFooter>
            </Drawer>

            {/* MODAL REPORTE PERÍODO */}
            {openReporteModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
                            <div>
                                <h3 className="font-bold text-lg">📊 Reporte de Movimientos</h3>
                                <p className="text-xs text-gray-500">{fechasReporte.inicio} al {fechasReporte.fin}</p>
                            </div>
                            <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenReporteModal(false)} />
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {reporteData.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">No hay movimientos en este período</div>
                            ) : (
                                <div className="space-y-3">
                                    {reporteData.map((mov) => (
                                        <div key={mov.id} className="border-b pb-3 mb-3 last:border-0">
                                            <div className="flex justify-between items-start">
                                                <Badge appearance="filled" color="brand">{mov.tipo_movimiento?.nombre}</Badge>
                                                <span className="text-xs text-gray-400">{mov.fecha_movimiento}</span>
                                            </div>
                                            <p className="text-sm font-medium mt-1">{mov.bien?.tipo_equipo} - {mov.bien?.codigo_patrimonial}</p>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {mov.persona_origen && <span>De: {mov.persona_origen?.nombres} {mov.persona_origen?.apellidos}</span>}
                                                {mov.persona_destino && <span className="ml-2">→ A: {mov.persona_destino?.nombres} {mov.persona_destino?.apellidos}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Asignaciones