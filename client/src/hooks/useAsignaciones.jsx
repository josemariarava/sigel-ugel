import { useEffect, useMemo, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'
import { buildMostrarToast } from '../lib/toastUtils'
import { createActaCargoPdf, createActaAsignacionPdf, createActaDevolucionPdf } from '../lib/pdfGenerator'
import { getEstadoColorAsignacion, TIPOS_TONER } from '../lib/utils'
import { Toast, ToastTitle, ToastBody } from '@fluentui/react-components'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const ESTADOS = {
    ASIGNACION: {
        ACTIVO: 'Activo',
        TRASLADADO: 'Trasladado',
        DEVUELTO: 'Devuelto',
        BAJA: 'Baja'
    },
    BIEN: {
        ACTIVO: 'Activo',
        ASIGNADO: 'Asignado',
        DISPONIBLE: 'Disponible',
        DADO_BAJA: 'Dado de Baja',
        AGOTADO: 'Agotado'
    }
}

export function useAsignaciones(dispatchToast) {
    const [activeTab, setActiveTab] = useState('lista')
    const [distribucionVista, setDistribucionVista] = useState('piso')

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
    const [searchTermBien, setSearchTermBien] = useState('')
    const [showBienDropdown, setShowBienDropdown] = useState(false)

    const [openTrasladoModal, setOpenTrasladoModal] = useState(false)
    const [openHistorialModal, setOpenHistorialModal] = useState(false)
    const [historialMovimientos, setHistorialMovimientos] = useState([])
    const [loadingHistorial, setLoadingHistorial] = useState(false)
    const [historialBienInfo, setHistorialBienInfo] = useState(null)

    const [openDetalleModal, setOpenDetalleModal] = useState(false)
    const [selectedPersonaDetalle, setSelectedPersonaDetalle] = useState(null)
    const [bienesPorPersona, setBienesPorPersona] = useState([])
    const [asignacionesToners, setAsignacionesToners] = useState([])

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
        persona_origen_id: ''
    })

    const [formData, setFormData] = useState({
        bien_id: '',
        persona_id: '',
        ambiente_id: '',
        fecha_asignacion: new Date().toISOString().split('T')[0],
        documento_referencia: '',
        persona_origen_id: '',
        motivo: '',
        observaciones: '',
        ubicacion_detalle: '',
        estado_asignacion: ESTADOS.ASIGNACION.ACTIVO
    })

    const almacenGeneral = useMemo(() =>
        todosLosAmbientes?.find(a => a.nombre === 'Almacén General' || a.tipo === 'Almacén'),
        [todosLosAmbientes]
    )

    const estadisticas = useMemo(() => {
        return {
            totalAsignaciones: asignaciones.length,
            activos: asignaciones.filter(a => a.estado_asignacion === ESTADOS.ASIGNACION.ACTIVO).length,
            trasladados: asignaciones.filter(a => a.estado_asignacion === ESTADOS.ASIGNACION.TRASLADADO).length,
            devueltos: asignaciones.filter(a => a.estado_asignacion === ESTADOS.ASIGNACION.DEVUELTO).length,
            baja: asignaciones.filter(a => a.estado_asignacion === ESTADOS.ASIGNACION.BAJA).length,
            enAlmacen: asignaciones.filter(a =>
                a.ambiente_id === almacenGeneral?.id && a.estado_asignacion === ESTADOS.ASIGNACION.DEVUELTO
            ).length
        }
    }, [asignaciones, todosLosAmbientes])

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
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const submittingRef = useRef(false)
    const autoPopulatedRef = useRef(false)
    const [tiposMovimiento, setTiposMovimiento] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 25

    const filteredAsignaciones = asignaciones.filter(asig =>
        asig.bien?.tipo_equipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.bien?.codigo_patrimonial?.includes(searchTerm) ||
        asig.persona?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.persona?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.persona?.dni?.includes(searchTerm) ||
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

    const totalPages = Math.max(1, Math.ceil(asignacionesFiltradasAvanzado.length / PAGE_SIZE))
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return asignacionesFiltradasAvanzado.slice(start, start + PAGE_SIZE)
    }, [asignacionesFiltradasAvanzado, currentPage])

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages)
    }, [asignacionesFiltradasAvanzado.length])

    useEffect(() => {
        setCurrentPage(1)
    }, [filtros])

    const tipoMovimientoId = (nombre) => tiposMovimiento.find(t => t.nombre === nombre)?.id || null

    const bienesDisponibles = bienes.filter(bien =>
        bien.condicion !== 'Chatarra' &&
        !asignaciones.some(asig =>
            asig.bien_id === bien.id && asig.estado_asignacion === ESTADOS.ASIGNACION.ACTIVO
        )
    )

    const bienesFiltrados = (editMode ? bienes : bienesDisponibles).filter(bien =>
        bien.tipo_equipo?.toLowerCase().includes(searchTermBien.toLowerCase()) ||
        bien.marca?.toLowerCase().includes(searchTermBien.toLowerCase()) ||
        bien.modelo?.toLowerCase().includes(searchTermBien.toLowerCase()) ||
        bien.codigo_patrimonial?.toLowerCase().includes(searchTermBien.toLowerCase()) ||
        bien.serie?.toLowerCase().includes(searchTermBien.toLowerCase())
    )

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
        if (todosLosAmbientes.length > 0 && !almacenGeneral) {
            mostrarToast('⚠️ No se encontró "Almacén General" en el sistema. Las devoluciones fallarán. Cree un ambiente con nombre "Almacén General" en algún piso.', 'warning')
        }
    }, [todosLosAmbientes, almacenGeneral])

    useEffect(() => {
        if (!openModal || editMode) {
            autoPopulatedRef.current = false
            return
        }
        if (autoPopulatedRef.current || personas.length === 0) return
        autoPopulatedRef.current = true

        supabase.auth.getSession().then(({ data }) => {
            const email = data?.session?.user?.email
            if (!email) return
            const match = personas.find(p => p.email?.toLowerCase() === email.toLowerCase())
            if (match) {
                setFormData(prev => prev.persona_origen_id ? prev : { ...prev, persona_origen_id: match.id })
            }
        })
    }, [openModal, editMode, personas])

    const trasladoAutoPopulatedRef = useRef(false)
    useEffect(() => {
        if (!openTrasladoModal) {
            trasladoAutoPopulatedRef.current = false
            return
        }
        if (trasladoAutoPopulatedRef.current || personas.length === 0 || trasladoData.persona_origen_id) return
        trasladoAutoPopulatedRef.current = true

        supabase.auth.getSession().then(({ data }) => {
            const email = data?.session?.user?.email
            if (!email) return
            const match = personas.find(p => p.email?.toLowerCase() === email.toLowerCase())
            if (match) {
                setTrasladoData(prev => ({ ...prev, persona_origen_id: match.id }))
            }
        })
    }, [openTrasladoModal, personas, trasladoData.persona_origen_id])

    const cargarDatos = async () => {
        try {
            setLoading(true)
            const results = await Promise.allSettled([
                supabase.from('asignaciones').select(`*, bien:bienes!fk_asignaciones_bien(*), persona:personas!fk_asignaciones_persona(*), persona_origen:personas!asignaciones_persona_origen_id_fkey(*), ambiente:ambientes!fk_asignaciones_ambiente(*, piso:pisos(*))`).order('fecha_asignacion', { ascending: false }),
                supabase.from('personas').select('*, area:areas(*)').order('apellidos'),
                supabase.from('pisos').select('*').order('numero'),
                supabase.from('ambientes').select('*, piso:pisos(*), area:areas(*)').order('nombre'),
                supabase.from('areas').select('*').order('nombre'),
                supabase.from('tipos_movimiento').select('*'),
                supabase.from('asignacion_toners').select('*, toner:bienes!asignacion_toners_toner_id_fkey(*), persona:personas!asignacion_toners_persona_id_fkey(*), ambiente:ambientes!asignacion_toners_ambiente_id_fkey(*)').eq('estado', 'Activo'),
            ])

            const extraer = (r) => r.status === 'fulfilled' ? (r.value.data || []) : []

            setAsignaciones(extraer(results[0]))
            setPersonas(extraer(results[1]))
            setPisos(extraer(results[2]))
            setTodosLosAmbientes(extraer(results[3]))
            setAreas(extraer(results[4]))
            setTiposMovimiento(extraer(results[5]))
            setAsignacionesToners(extraer(results[6]))

            const fallos = results.filter(r => r.status === 'rejected')
            if (fallos.length > 0) {
                console.error(`${fallos.length} consulta(s) fallaron al cargar datos`)
            }
        } finally {
            setLoading(false)
        }
    }

    const cargarBienesActivos = async () => {
        try {
            const { data, error } = await supabase
                .from('bienes')
                .select('*')
                .in('estado', [ESTADOS.BIEN.ACTIVO, ESTADOS.BIEN.ASIGNADO, ESTADOS.BIEN.DISPONIBLE])
                .order('tipo_equipo')
            if (error) throw error
            const consumibles = [...TIPOS_TONER, 'Cartucho', 'Cinta', 'Batería', 'Cargador']
            setBienes((data || []).filter(b => !consumibles.includes(b.tipo_equipo)))
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar bienes'), 'error')
        }
    }

    const mostrarToast = buildMostrarToast(dispatchToast)

    const verBienesPorPersona = (personaId, personaNombre, personaApellidos) => {
        const bienesAsignados = asignaciones.filter(asig =>
            asig.persona_id === personaId &&
            asig.estado_asignacion === ESTADOS.ASIGNACION.ACTIVO
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
            asig.estado_asignacion === ESTADOS.ASIGNACION.ACTIVO
        )
        const tonersEnUbicacion = asignacionesToners
            .filter(asig => asig.ambiente_id === ambienteId)
            .map(asig => ({ ...asig, _esToner: true }))
        setBienesPorPersona([...bienesEnUbicacion, ...tonersEnUbicacion])
        setSelectedPersonaDetalle({
            id: ambienteId,
            nombre: ambienteSeleccionado?.nombre || 'Ambiente',
            esUbicacion: true,
            ambienteData: ambienteSeleccionado
        })
        setOpenDetalleModal(true)
    }

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
            const cantidadBienes = asignaciones.filter(a => a.ambiente_id === ambienteId && a.estado_asignacion === ESTADOS.ASIGNACION.ACTIVO).length
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

    const generarActaCargo = async (personaId, personaNombre, personaApellidos, personaData) => {
        try {
            setExportando(true)

            const bienesPersona = asignaciones.filter(asig =>
                asig.persona_id === personaId &&
                asig.estado_asignacion === ESTADOS.ASIGNACION.ACTIVO
            )

            if (bienesPersona.length === 0) {
                mostrarToast('Esta persona no tiene bienes asignados activos', 'error')
                return
            }

            const doc = createActaCargoPdf({ personaNombre, personaApellidos, personaData, bienesPersona })

            doc.save(`cargo_${personaApellidos}_${new Date().toISOString().split('T')[0]}.pdf`)

            mostrarToast('Acta de cargo generada correctamente 📄', 'success')
        } catch (error) {
            mostrarToast(handleApiError(error, 'generar acta'), 'error')
        } finally {
            setExportando(false)
        }
    }

    const generarActaAsignacion = async (asignacion) => {
        try {
            setExportando(true)

            // Defensa: re-fecha de la BD para evitar stale state tras edición
            try {
                const { data: _fresh } = await supabase.from('asignaciones').select('fecha_asignacion').eq('id', asignacion.id).single()
                if (_fresh?.fecha_asignacion) asignacion.fecha_asignacion = _fresh.fecha_asignacion
            } catch { /* si falla el re-fetch, usa la fecha del objeto pasado */ }

            console.log('[generarActaAsignacion] asignacion.persona:', asignacion.persona)
            console.log('[generarActaAsignacion] asignacion.persona_id:', asignacion.persona_id)
            console.log('[generarActaAsignacion] asignacion.persona_origen:', asignacion.persona_origen)

            let personaData = asignacion.persona
            if ((!personaData || !personaData.nombres) && asignacion.persona_id) {
                console.log('[generarActaAsignacion] Fetching persona from DB...')
                const { data: personaFetch, error: personaErr } = await supabase
                    .from('personas')
                    .select('*')
                    .eq('id', asignacion.persona_id)
                    .single()
                console.log('[generarActaAsignacion] personaFetch:', personaFetch, 'error:', personaErr)
                if (personaFetch) personaData = personaFetch
            }

            let personaOrigenData = asignacion.persona_origen
            if ((!personaOrigenData || !personaOrigenData.nombres) && asignacion.persona_origen_id) {
                console.log('[generarActaAsignacion] Fetching persona_origen from DB...')
                const { data: origenFetch, error: origenErr } = await supabase
                    .from('personas')
                    .select('*')
                    .eq('id', asignacion.persona_origen_id)
                    .single()
                console.log('[generarActaAsignacion] origenFetch:', origenFetch, 'error:', origenErr)
                if (origenFetch) personaOrigenData = origenFetch
            }

            console.log('[generarActaAsignacion] FINAL personaData:', personaData)
            console.log('[generarActaAsignacion] FINAL personaOrigenData:', personaOrigenData)

            const doc = await createActaAsignacionPdf({
                asignacion,
                personaAsignada: personaData,
                personaOrigenFetch: personaOrigenData
            })

            doc.save(`Acta_Equipo_${asignacion.numero_acta || 'NUEVA'}.pdf`)

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
            setExportando(false)
        }
    }

    const generarActaDevolucion = async (asignacion, motivoDevolucion) => {
        try {
            setExportando(true)

            // Defensa: re-fecha de la BD para evitar stale state tras edición
            try {
                const { data: _fresh } = await supabase.from('asignaciones').select('fecha_actualizacion,fecha_asignacion').eq('id', asignacion.id).single()
                if (_fresh?.fecha_actualizacion) asignacion.fecha_actualizacion = _fresh.fecha_actualizacion
                if (_fresh?.fecha_asignacion) asignacion.fecha_asignacion = _fresh.fecha_asignacion
            } catch { /* si falla el re-fetch, usa la fecha del objeto pasado */ }

            let personaDevuelve = asignacion.persona

            if (!personaDevuelve) {
                const tipoDevId = tipoMovimientoId('Devolución')
                if (tipoDevId) {
                    const { data: historial } = await supabase
                        .from('historial_movimientos')
                        .select('persona_origen:personas!historial_movimientos_persona_origen_id_fkey(*)')
                        .eq('bien_id', asignacion.bien_id)
                        .eq('tipo_movimiento_id', tipoDevId)
                        .order('fecha_movimiento', { ascending: false })
                        .limit(1)
                        .single()
                    personaDevuelve = historial?.persona_origen || null
                }
            }

            const doc = await createActaDevolucionPdf({
                asignacion,
                personaDevuelve,
                motivoDevolucion: motivoDevolucion || asignacion.motivo || '',
                fechaDevolucion: trasladoData.fecha || asignacion.fecha_actualizacion || asignacion.fecha_asignacion || new Date().toISOString().split('T')[0]
            })

            doc.save(`Acta_Devolucion_${asignacion.numero_acta || 'NUEVA'}.pdf`)

            try {
                const blob = doc.output('blob')
                const fileName = `actas/devoluciones/Acta_Devolucion_${asignacion.numero_acta || 'NUEVA'}.pdf`

                const { error: uploadError } = await supabase.storage
                    .from('actas')
                    .upload(fileName, blob, { contentType: 'application/pdf', upsert: true })

                if (uploadError) {
                    console.warn('Error subiendo acta de devolución:', uploadError)
                    mostrarToast(`⚠️ Error al subir acta: ${uploadError.message}`, 'warning')
                } else {
                    const { data: urlData } = supabase.storage
                        .from('actas')
                        .getPublicUrl(fileName)

                    if (urlData?.publicUrl) {
                        await supabase
                            .from('asignaciones')
                            .update({ acta_url_devolucion: urlData.publicUrl })
                            .eq('id', asignacion.id)

                        setAsignaciones(prev => prev.map(a =>
                            a.id === asignacion.id ? { ...a, acta_url_devolucion: urlData.publicUrl } : a
                        ))
                    }
                }
            } catch (storageError) {
                console.warn('No se pudo subir el acta de devolución al storage:', storageError)
            }

            mostrarToast('Acta de devolución generada correctamente 📄', 'success')
        } catch (error) {
            mostrarToast(handleApiError(error, 'generar acta de devolución'), 'error')
        } finally {
            setExportando(false)
        }
    }

    const exportarAExcel = async () => {
        try {
            setExportando(true)
            const { utils, writeFile } = await import('xlsx')
            const datosExportar = asignacionesFiltradasAvanzado.map(asig => ({
                'N° Acta': asig.numero_acta || '',
                'Tipo de Bien': asig.bien?.tipo_equipo,
                'Marca': asig.bien?.marca || '',
                'Modelo': asig.bien?.modelo || '',
                'Código Patrimonial': asig.bien?.codigo_patrimonial || '',
                'Serie': asig.bien?.serie || '',
                'Responsable': `${asig.persona?.apellidos} ${asig.persona?.nombres}`,
                'DNI': asig.persona?.dni || '',
                'Cargo': asig.persona?.cargo || '',
                'Asignado por': `${asig.persona_origen?.apellidos || ''} ${asig.persona_origen?.nombres || ''}`.trim(),
                'Motivo': asig.motivo || '',
                'Ubicación': `${asig.ambiente?.nombre || ''} (Piso ${asig.ambiente?.piso?.numero || ''})`,
                'Fecha Asignación': asig.fecha_asignacion,
                'Estado': asig.estado_asignacion,
                'Documento Ref.': asig.documento_referencia || '',
                'Observaciones': asig.observaciones || ''
            }))

            const ws = utils.json_to_sheet(datosExportar)
            ws['!cols'] = [
                { wch: 14 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
                { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 20 },
                { wch: 30 }, { wch: 18 },
                { wch: 28 }, { wch: 16 }, { wch: 14 },
                { wch: 18 }, { wch: 30 }
            ]

            const wb = utils.book_new()
            utils.book_append_sheet(wb, ws, 'Asignaciones')
            writeFile(wb, `asignaciones_${new Date().toISOString().split('T')[0]}.xlsx`)

            mostrarToast('Exportación completada ✅', 'success')
        } catch (error) {
            mostrarToast(handleApiError(error, 'exportar datos'), 'error')
        } finally {
            setExportando(false)
        }
    }

    const exportarAPdf = async () => {
        try {
            setExportando(true)

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            })

            const fechaActual = new Date().toLocaleDateString('es-PE', {
                year: 'numeric', month: 'long', day: 'numeric'
            })

            const columnas = [
                { header: 'N° Acta', dataKey: 'acta' },
                { header: 'Tipo de Bien', dataKey: 'tipo' },
                { header: 'Código Pat.', dataKey: 'codigo' },
                { header: 'Marca/Modelo', dataKey: 'modelo' },
                { header: 'Responsable', dataKey: 'responsable' },
                { header: 'Asignado por', dataKey: 'asignadoPor' },
                { header: 'Motivo', dataKey: 'motivo' },
                { header: 'Ubicación', dataKey: 'ubicacion' },
                { header: 'Fecha', dataKey: 'fecha' },
                { header: 'Estado', dataKey: 'estado' },
                { header: 'Doc. Ref.', dataKey: 'docRef' }
            ]

            const filas = asignacionesFiltradasAvanzado.map(asig => ({
                acta: asig.numero_acta || '',
                tipo: asig.bien?.tipo_equipo || '',
                codigo: asig.bien?.codigo_patrimonial || '',
                modelo: `${asig.bien?.marca || 'S/M'} ${asig.bien?.modelo || 'S/M'}`,
                responsable: asig.persona ? `${asig.persona.apellidos}, ${asig.persona.nombres}` : 'No asignado',
                asignadoPor: `${asig.persona_origen?.apellidos || ''} ${asig.persona_origen?.nombres || ''}`.trim(),
                motivo: asig.motivo || '',
                ubicacion: `${asig.ambiente?.nombre || 'Almacén General'} (Piso ${asig.ambiente?.piso?.numero ?? '0'})`,
                fecha: asig.fecha_asignacion || '',
                estado: asig.estado_asignacion || '',
                docRef: asig.documento_referencia || ''
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
            setExportando(false)
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
            asig.estado_asignacion === ESTADOS.ASIGNACION.ACTIVO &&
            new Date(asig.fecha_actualizacion || asig.fecha_asignacion) < tresMesesAtras
        )

        if (bienesInactivos.length > 0) {
            mostrarToast(`📢 ${bienesInactivos.length} bienes sin movimiento en los últimos 3 meses`, 'info')
        } else {
            mostrarToast('✅ Todos los bienes tienen movimiento reciente', 'success')
        }
    }

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
            const { data: existing } = await supabase
                .from('historial_movimientos')
                .select('id')
                .eq('bien_id', movimiento.bien_id)
                .eq('tipo_movimiento_id', movimiento.tipo_movimiento_id)
                .eq('fecha_movimiento', movimiento.fecha_movimiento)
                .eq('persona_destino_id', movimiento.persona_destino_id)
                .limit(1)

            if (existing && existing.length > 0) {
                console.log('[registrar movimiento] Duplicado omitido:', movimiento.bien_id, movimiento.tipo_movimiento_id)
                return true
            }

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
        if (submittingRef.current) return
        if (!trasladoData.persona_destino_id && trasladoData.tipo === 'traslado') {
            mostrarToast('Seleccione el nuevo responsable', 'error')
            return
        }
        if (!trasladoData.ambiente_destino_id && trasladoData.tipo !== 'baja' && trasladoData.tipo !== 'devolucion') {
            mostrarToast('Seleccione la nueva ubicación', 'error')
            return
        }

        submittingRef.current = true
        setSubmitting(true)
        try {
            const asignacionActual = selectedAsignacion
            const tipo = trasladoData.tipo
            const motivoFinal = trasladoData.motivo === 'Otro'
                ? trasladoData.motivo_especifico
                : trasladoData.motivo

            const tipoMovId = tipoMovimientoId(getTipoMovNombre(tipo))
            const almacen = getAlmacenGeneral()

            let usuarioRegistroNombre = null
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user?.email) {
                const match = personas.find(p => p.email?.toLowerCase() === session.user.email.toLowerCase())
                if (match) {
                    usuarioRegistroNombre = `${match.nombres} ${match.apellidos}`
                }
            }

            if (tipo === 'traslado') {
                const anio = new Date().getFullYear()
                const { data: nextNum, error: actaError } = await supabase.rpc('siguiente_acta', { p_anio: anio })
                if (actaError) throw actaError
                const numeroActa = `${String(nextNum).padStart(4, '0')}-${anio}`

                const { error: updateOldError } = await supabase
                    .from('asignaciones')
                    .update({
                        estado_asignacion: ESTADOS.ASIGNACION.TRASLADADO,
                        fecha_actualizacion: trasladoData.fecha
                    })
                    .eq('id', asignacionActual.id)
                if (updateOldError) throw updateOldError

                const { error: insertError } = await supabase
                    .from('asignaciones')
                    .insert({
                        bien_id: asignacionActual.bien_id,
                        persona_id: trasladoData.persona_destino_id,
                        ambiente_id: trasladoData.ambiente_destino_id,
                        estado_asignacion: ESTADOS.ASIGNACION.ACTIVO,
                        fecha_asignacion: trasladoData.fecha,
                        fecha_actualizacion: trasladoData.fecha,
                        persona_origen_id: trasladoData.persona_origen_id || asignacionActual.persona_id,
                        motivo: motivoFinal,
                        observaciones: trasladoData.observaciones || `Transferido desde ${asignacionActual.persona?.nombres || ''} ${asignacionActual.persona?.apellidos || ''}`,
                        documento_referencia: trasladoData.documento_referencia || null,
                        numero_acta: numeroActa
                    })
                    .select()
                    .single()
                if (insertError) {
                    await supabase
                        .from('asignaciones')
                        .update({
                            estado_asignacion: ESTADOS.ASIGNACION.ACTIVO,
                            fecha_actualizacion: trasladoData.fecha
                        })
                        .eq('id', asignacionActual.id)
                    throw insertError
                }
            } else {
                const updateData = buildUpdateAsignacion(tipo, asignacionActual, almacen)
                const { error: updateError } = await supabase
                    .from('asignaciones')
                    .update(updateData)
                    .eq('id', asignacionActual.id)
                if (updateError) throw updateError
            }

            const movOk = await registrarMovimiento(
                getMovimiento(tipo, asignacionActual, tipoMovId, motivoFinal, usuarioRegistroNombre)
            )

            if (tipo === 'devolucion') {
                await generarActaDevolucion(asignacionActual, motivoFinal)
            }

            const mensajeBase = tipo === 'traslado' ? '✅ Bien trasladado exitosamente' :
                tipo === 'devolucion' ? '↩️ Bien devuelto al almacén' :
                    '⚠️ Bien dado de baja'

            mostrarToast(movOk ? mensajeBase : mensajeBase + ' ⚠️ El historial no pudo guardarse', movOk ? 'success' : 'warning')

            setOpenTrasladoModal(false)
            resetTrasladoForm()
            cargarDatos()
            cargarBienesActivos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'trasladar bien'), 'error')
        } finally {
            submittingRef.current = false
            setSubmitting(false)
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
            persona_origen_id: ''
        })
        setInfoNuevoResponsable(null)
        setInfoNuevoAmbiente(null)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async () => {
        if (submittingRef.current) return

        const esDevueltoOBaja = editMode && (formData.estado_asignacion === 'Devuelto' || formData.estado_asignacion === 'Baja')

        if (!formData.bien_id) {
            mostrarToast('Seleccione un bien', 'error')
            return
        }

        if (!esDevueltoOBaja && !formData.persona_id) {
            mostrarToast('Complete los campos obligatorios', 'error')
            return
        }

        submittingRef.current = true
        setSubmitting(true)
        try {
            if (!editMode) {
                const { data: existingActiva } = await supabase
                    .from('asignaciones')
                    .select('id')
                    .eq('bien_id', formData.bien_id)
                    .eq('estado_asignacion', ESTADOS.ASIGNACION.ACTIVO)
                    .limit(1)

                if (existingActiva && existingActiva.length > 0) {
                    mostrarToast('⚠️ Este bien ya está asignado actualmente. Use la opción "Traslado" para transferirlo a otro responsable.', 'error')
                    submittingRef.current = false
                    setSubmitting(false)
                    return
                }

                const { data: bien } = await supabase
                    .from('bienes')
                    .select('condicion')
                    .eq('id', formData.bien_id)
                    .single()

                if (bien?.condicion === 'Chatarra') {
                    mostrarToast('⚠️ No se puede asignar un bien marcado como Chatarra. Cambie su condición en Bienes primero.', 'error')
                    submittingRef.current = false
                    setSubmitting(false)
                    return
                }
                if (bien?.condicion === 'Malo') {
                    mostrarToast('⚠️ Este bien está en condición "Malo". Verifique antes de asignar.', 'warning')
                }
            }

            const anio = new Date().getFullYear()

            if (editMode) {
                const esDevueltoOBajaEdit = formData.estado_asignacion === 'Devuelto' || formData.estado_asignacion === 'Baja'

                const payload = esDevueltoOBajaEdit
                    ? {
                        fecha_asignacion: formData.fecha_asignacion,
                        observaciones: formData.observaciones,
                        documento_referencia: formData.documento_referencia || null,
                        motivo: formData.motivo || null,
                    }
                    : {
                        bien_id: formData.bien_id,
                        persona_id: formData.persona_id,
                        ambiente_id: formData.ambiente_id || null,
                        fecha_asignacion: formData.fecha_asignacion,
                        observaciones: formData.observaciones,
                        ubicacion_detalle: formData.ubicacion_detalle || null,
                        documento_referencia: formData.documento_referencia || null,
                        persona_origen_id: formData.persona_origen_id || null,
                        motivo: formData.motivo || null,
                        estado_asignacion: formData.estado_asignacion,
                    }
                const { error } = await supabase
                    .from('asignaciones')
                    .update({ ...payload, fecha_actualizacion: new Date().toISOString().split('T')[0] })
                    .eq('id', selectedAsignacion.id)

                if (error) throw error
                mostrarToast('Asignación actualizada ✨')
            } else {
                let numeroActa

                for (let attempt = 0; attempt < 3; attempt++) {
                    const { data: nextNum, error: actaError } = await supabase.rpc('siguiente_acta', { p_anio: anio })

                    if (actaError) throw actaError
                    numeroActa = `${String(nextNum).padStart(4, '0')}-${anio}`

                    const payload = {
                        bien_id: formData.bien_id,
                        persona_id: formData.persona_id,
                        ambiente_id: formData.ambiente_id || null,
                        fecha_asignacion: formData.fecha_asignacion,
                        observaciones: formData.observaciones,
                        ubicacion_detalle: formData.ubicacion_detalle || null,
                        documento_referencia: formData.documento_referencia || null,
                        persona_origen_id: formData.persona_origen_id || null,
                        motivo: formData.motivo || null,
                        estado_asignacion: formData.estado_asignacion,
                        numero_acta: numeroActa
                    }

                    const { error } = await supabase
                        .from('asignaciones')
                        .insert([payload])

                    if (error) {
                        if (error.code === '23505' && attempt < 2) continue
                        throw error
                    }
                    break
                }

                const movOk = await registrarMovimiento({
                    bien_id: formData.bien_id,
                    tipo_movimiento_id: tipoMovimientoId('Asignación Inicial'),
                    persona_origen_id: formData.persona_origen_id || null,
                    persona_destino_id: formData.persona_id,
                    ambiente_destino_id: formData.ambiente_id || null,
                    fecha_movimiento: formData.fecha_asignacion,
                    documento_referencia: formData.documento_referencia || null,
                    motivo: formData.motivo || null,
                    observaciones: formData.observaciones || 'Asignación inicial del bien'
                })

                mostrarToast(movOk ? 'Asignación registrada ✅' : 'Asignación registrada ⚠️ No se pudo guardar el historial', movOk ? 'success' : 'warning')
            }

            setOpenModal(false)
            resetForm()
            cargarDatos()
            cargarBienesActivos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'guardar asignación'), 'error')
        } finally {
            submittingRef.current = false
            setSubmitting(false)
        }
    }

    const openModalAsignacion = () => {
        cargarBienesActivos()
        setOpenModal(true)
    }

    const handleEdit = (asignacion) => {
        setEditMode(true)
        setSelectedAsignacion(asignacion)
        setFormData({
            bien_id: asignacion.bien_id,
            persona_id: asignacion.persona_id,
            ambiente_id: asignacion.ambiente_id || '',
            fecha_asignacion: asignacion.fecha_asignacion,
            documento_referencia: asignacion.documento_referencia || '',
            persona_origen_id: asignacion.persona_origen_id || '',
            motivo: asignacion.motivo || '',
            observaciones: asignacion.observaciones || '',
            ubicacion_detalle: asignacion.ubicacion_detalle || '',
            estado_asignacion: asignacion.estado_asignacion || ESTADOS.ASIGNACION.ACTIVO
        })
        if (asignacion.ambiente?.piso_id) setSelectedPiso(asignacion.ambiente.piso_id)

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
            const cantidadBienes = asignaciones.filter(a => a.ambiente_id === ambienteData.id && a.estado_asignacion === ESTADOS.ASIGNACION.ACTIVO).length
            setInfoAmbiente({
                nombre: ambienteData.nombre,
                codigo: ambienteData.codigo,
                piso: ambienteData.piso?.nombre || `Piso ${ambienteData.piso?.numero}`,
                tipo: ambienteData.tipo || 'Oficina',
                area: ambienteData.area?.nombre || null,
                bienesOcupados: cantidadBienes
            })
        }

        cargarBienesActivos()
        setOpenModal(true)
    }

    const handleDelete = (asignacion) => {
        setDeleteTarget(asignacion)
    }

    const confirmDelete = async () => {
        if (submittingRef.current || !deleteTarget) return
        submittingRef.current = true
        setSubmitting(true)
        try {
            const { error } = await supabase.from('asignaciones').delete().eq('id', deleteTarget.id)
            if (error) throw error

            mostrarToast('Registro eliminado')
            cargarDatos()
            cargarBienesActivos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'eliminar asignación'), 'error')
        } finally {
            submittingRef.current = false
            setSubmitting(false)
            setDeleteTarget(null)
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
            ubicacion_detalle: '',
            estado_asignacion: ESTADOS.ASIGNACION.ACTIVO
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

    const getEstadoPorTipo = (tipo) => {
        switch (tipo) {
        case 'traslado': return ESTADOS.ASIGNACION.TRASLADADO
        case 'devolucion': return ESTADOS.ASIGNACION.DEVUELTO
        case 'baja': return ESTADOS.ASIGNACION.BAJA
        default: return ESTADOS.ASIGNACION.ACTIVO
        }
    }

    const getTipoMovNombre = (tipo) => {
        switch (tipo) {
            case 'traslado': return 'Traslado'
            case 'devolucion': return 'Devolución'
            case 'baja': return 'Baja Definitiva'
            default: return null
        }
    }

    const getAlmacenGeneral = () => almacenGeneral

    const buildUpdateAsignacion = (tipo, asignacionActual, almacen) => {
        const motivoFinal = trasladoData.motivo === 'Otro'
            ? trasladoData.motivo_especifico
            : trasladoData.motivo
        const payload = {
            fecha_actualizacion: trasladoData.fecha,
            estado_asignacion: getEstadoPorTipo(tipo),
            persona_origen_id: trasladoData.persona_origen_id || null,
            motivo: motivoFinal || null,
            documento_referencia: trasladoData.documento_referencia || null
        }
        if (tipo === 'devolucion') {
            if (almacen) payload.ambiente_id = almacen.id
            payload.persona_id = null
        }
        return payload
    }

    const getMovimiento = (tipo, asignacionActual, tipoMovId, motivoFinal, usuarioRegistroNombre) => {
        const ambDestId = tipo === 'devolucion' ? getAlmacenGeneral()?.id : trasladoData.ambiente_destino_id
        return {
            bien_id: asignacionActual.bien_id,
            tipo_movimiento_id: tipoMovId,
            persona_origen_id: asignacionActual.persona_id,
            persona_destino_id: tipo === 'traslado' ? trasladoData.persona_destino_id : null,
            ambiente_origen_id: asignacionActual.ambiente_id,
            ambiente_destino_id: ambDestId || null,
            fecha_movimiento: trasladoData.fecha,
            motivo: motivoFinal,
            documento_referencia: trasladoData.documento_referencia,
            observaciones: trasladoData.observaciones,
            usuario_registro: usuarioRegistroNombre
        }
    }

    const [showCloseConfirm, setShowCloseConfirm] = useState(false)
    const [showTrasladoCloseConfirm, setShowTrasladoCloseConfirm] = useState(false)

    const formHasData = formData.bien_id || formData.persona_id || formData.ambiente_id || formData.fecha_asignacion || formData.persona_origen_id || formData.motivo || formData.observaciones || formData.ubicacion_detalle || formData.documento_referencia

    const requestCloseDrawer = () => {
        if (formHasData) {
            setShowCloseConfirm(true)
        } else {
            setOpenModal(false)
            resetForm()
            setSearchTermBien('')
        }
    }

    const confirmCloseDrawer = () => {
        setShowCloseConfirm(false)
        setOpenModal(false)
        setSearchTermBien('')
        resetForm()
    }

    const cancelCloseDrawer = () => {
        setShowCloseConfirm(false)
    }

    const trasladoHasData = trasladoData.persona_destino_id || trasladoData.ambiente_destino_id || trasladoData.motivo || trasladoData.observaciones || trasladoData.documento_referencia

    const requestCloseTrasladoDrawer = () => {
        if (trasladoHasData) {
            setShowTrasladoCloseConfirm(true)
        } else {
            setOpenTrasladoModal(false)
            resetTrasladoForm()
        }
    }

    const confirmCloseTrasladoDrawer = () => {
        setShowTrasladoCloseConfirm(false)
        setOpenTrasladoModal(false)
        resetTrasladoForm()
    }

    const cancelCloseTrasladoDrawer = () => {
        setShowTrasladoCloseConfirm(false)
    }

    return {
        activeTab, setActiveTab,
        distribucionVista, setDistribucionVista,
        asignaciones, setAsignaciones,
        bienes, personas, areas, pisos, todosLosAmbientes, ambientesFiltrados,
        loading, setLoading,
        searchTerm, setSearchTerm,
        openModal, setOpenModal,
        openModalAsignacion,
        editMode, setEditMode,
        selectedAsignacion, setSelectedAsignacion,
        selectedPiso, setSelectedPiso,
        searchTermBien, setSearchTermBien,
        showBienDropdown, setShowBienDropdown,
        openTrasladoModal, setOpenTrasladoModal,
        openHistorialModal, setOpenHistorialModal,
        historialMovimientos, loadingHistorial, historialBienInfo,
        openDetalleModal, setOpenDetalleModal,
        selectedPersonaDetalle, bienesPorPersona,
        asignacionesToners,
        infoResponsable, setInfoResponsable,
        infoAmbiente, setInfoAmbiente,
        infoNuevoResponsable, setInfoNuevoResponsable,
        infoNuevoAmbiente, setInfoNuevoAmbiente,
        trasladoData, setTrasladoData,
        formData, setFormData,
        estadisticas,
        filtros, setFiltros,
        openReporteModal, setOpenReporteModal,
        reporteData, setReporteData,
        fechasReporte, setFechasReporte,
        exportando, setExportando,
        filteredAsignaciones,
        asignacionesFiltradasAvanzado,
        paginatedData, currentPage, setCurrentPage, totalPages, PAGE_SIZE,
        bienesDisponibles, bienesFiltrados,
        cargarDatos, verificarBienesSinMovimiento, mostrarToast,
        verBienesPorPersona, verBienesPorUbicacion,
        handlePersonaChange, handleAmbienteChange,
        handleNuevoResponsableChange, handleNuevoAmbienteChange,
        generarActaCargo, generarActaAsignacion, generarActaDevolucion,
        exportarAExcel, exportarAPdf, generarReportePorPeriodo,
        cargarHistorialMovimientos, handleTraslado, resetTrasladoForm,
        handleInputChange, handleSubmit, handleEdit, handleDelete, confirmDelete,
        deleteTarget, setDeleteTarget, resetForm,
        submitting,
        obtenerPisosMapa, obtenerAreasMapa,
        getEstadoColor: getEstadoColorAsignacion,
        showCloseConfirm, showTrasladoCloseConfirm,
        requestCloseDrawer, confirmCloseDrawer, cancelCloseDrawer,
        requestCloseTrasladoDrawer, confirmCloseTrasladoDrawer, cancelCloseTrasladoDrawer,
    }
}
