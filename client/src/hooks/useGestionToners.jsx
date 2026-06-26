import { useEffect, useMemo, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'
import { createActaTonerPdf } from '../lib/pdfGeneratorToners'
import { Toast, ToastTitle, ToastBody } from '@fluentui/react-components'

export function useGestionToners(dispatchToast) {
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
    const [openActaModal, setOpenActaModal] = useState(false)
    const [actaData, setActaData] = useState(null)
    const [openHistorialModal, setOpenHistorialModal] = useState(false)
    const [historialAsignaciones, setHistorialAsignaciones] = useState([])
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const submittingRef = useRef(false)
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 25

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

    useEffect(() => {
        cargarDatos()
    }, [])

    useEffect(() => {
        if (formData.toner_id) {
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

    useEffect(() => {
        if (selectedPiso) {
            const filtrados = ambientes.filter(amb => amb.piso_id === selectedPiso)
            setAmbientesFiltrados(filtrados)
        } else {
            setAmbientesFiltrados([])
        }
    }, [selectedPiso, ambientes])

    const mostrarToast = (mensaje, tipo = 'success') => {
        dispatchToast(
            <Toast>
                <ToastTitle>{tipo === 'success' ? '✅ Éxito' : '❌ Error'}</ToastTitle>
                <ToastBody>{mensaje}</ToastBody>
            </Toast>,
            { intent: tipo }
        )
    }

    const cargarDatos = async () => {
        try {
            setLoading(true)

            const [
                asignacionesResult,
                tonersResult,
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
                supabase.from('bienes').select('*').eq('tipo_equipo', 'Tóner').in('estado', ['Disponible', 'Asignado', 'Activo', 'Agotado']).order('marca'),
                supabase.from('personas').select('*').order('apellidos'),
                supabase.from('ambientes').select('*, piso:pisos(*)').order('nombre'),
                supabase.from('pisos').select('*').order('numero'),
                supabase.from('compra_detalles').select('*, compra:compras_toners!compra_detalles_compra_id_fkey(*)'),
            ])

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
            setPersonas(personasResult.data || [])
            setAmbientes(ambientesResult.data || [])
            setPisos(pisosResult.data || [])

        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar datos'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const cargarImpresoras = async () => {
        try {
            const { data, error } = await supabase
                .from('bienes')
                .select('*')
                .in('tipo_equipo', ['Impresora', 'Multifuncional'])
                .eq('estado', 'Activo')
                .order('marca')
            if (error) throw error
            setImpresoras(data || [])
        } catch (error) {
            console.error('Error al cargar impresoras:', error.message)
        }
    }

    const openDrawerToners = () => {
        cargarImpresoras()
        setOpenDrawer(true)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async () => {
        if (submittingRef.current) return
        if (!formData.toner_id || !formData.persona_id) {
            mostrarToast('Complete los campos obligatorios', 'error')
            return
        }
        if (!editMode && !entregadoPor) {
            mostrarToast('Seleccione quien entrega el tóner', 'error')
            return
        }

        submittingRef.current = true
        setSubmitting(true)
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

                await supabase
                    .from('bienes')
                    .update({ estado: 'Asignado' })
                    .eq('id', formData.toner_id)

                if (data && data[0]) {
                    await generarActa(data[0])
                }

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
        } finally {
            submittingRef.current = false
            setSubmitting(false)
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
        cargarImpresoras()
        setOpenDrawer(true)
    }

    const handleDelete = (asignacion) => {
        setDeleteTarget(asignacion)
    }

    const confirmDelete = async () => {
        if (submittingRef.current || !deleteTarget) return
        submittingRef.current = true
        setSubmitting(true)
        try {
            const { error: tonerError } = await supabase
                .from('bienes')
                .update({ estado: 'Disponible' })
                .eq('id', deleteTarget.toner_id)

            if (tonerError) throw tonerError

            const { error } = await supabase
                .from('asignacion_toners')
                .delete()
                .eq('id', deleteTarget.id)

            if (error) throw error

            try {
                await supabase
                    .from('toner_movimientos')
                    .insert([{
                        toner_id: deleteTarget.toner_id,
                        tipo: 'liberado',
                        fecha: new Date().toISOString().split('T')[0],
                        descripcion: 'Asignación eliminada, tóner liberado',
                        metadata: {
                            asignacion_id: deleteTarget.id,
                            persona: deleteTarget.persona_id || null,
                            ambiente: deleteTarget.ambiente_id || null,
                            impresora: deleteTarget.impresora_id || null,
                            numero_acta: deleteTarget.numero_acta,
                            documento_referencia: deleteTarget.documento_referencia || null,
                            observaciones: deleteTarget.observaciones || null
                        }
                    }])
            } catch (movError) {
                console.warn('Tabla toner_movimientos no disponible:', movError)
            }

            mostrarToast('Asignación eliminada y tóner liberado')
            cargarDatos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'eliminar asignación de tóner'), 'error')
        } finally {
            submittingRef.current = false
            setSubmitting(false)
            setDeleteTarget(null)
        }
    }

    const devolverToner = async (asignacion) => {
        if (submittingRef.current) return
        submittingRef.current = true
        setSubmitting(true)
        try {
            const { error: tonerError } = await supabase
                .from('bienes')
                .update({ estado: 'Disponible' })
                .eq('id', asignacion.toner_id)

            if (tonerError) throw tonerError

            const { error } = await supabase
                .from('asignacion_toners')
                .delete()
                .eq('id', asignacion.id)

            if (error) throw error

            try {
                await supabase
                    .from('toner_movimientos')
                    .insert([{
                        toner_id: asignacion.toner_id,
                        tipo: 'devolucion',
                        fecha: new Date().toISOString().split('T')[0],
                        descripcion: `Devuelto a stock por ${asignacion.persona?.apellidos || ''}, ${asignacion.persona?.nombres || ''}`,
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

            mostrarToast('✅ Tóner devuelto a stock correctamente')
            cargarDatos()
        } catch (error) {
            mostrarToast(handleApiError(error, 'devolver tóner'), 'error')
        } finally {
            submittingRef.current = false
            setSubmitting(false)
        }
    }

    const handleTerminar = async () => {
        if (submittingRef.current) return
        if (!terminarData.fecha_terminado) {
            mostrarToast('Seleccione la fecha de terminado', 'error')
            return
        }

        submittingRef.current = true
        setSubmitting(true)
        try {
            const fechaAsignacion = new Date(selectedAsignacion.fecha_asignacion)
            const fechaTermino = new Date(terminarData.fecha_terminado)
            const duracionDias = Math.ceil((fechaTermino - fechaAsignacion) / (1000 * 60 * 60 * 24))

            const { error: tonerError } = await supabase
                .from('bienes')
                .update({ estado: 'Agotado' })
                .eq('id', selectedAsignacion.toner_id)

            if (tonerError) throw tonerError

            const tonerActual = selectedAsignacion.toner
            const { data: tonersMismoModelo } = await supabase
                .from('bienes')
                .select('*')
                .eq('tipo_equipo', 'Tóner')
                .eq('marca', tonerActual.marca)
                .eq('modelo', tonerActual.modelo)
                .in('estado', ['Activo', 'Disponible'])

            if (tonersMismoModelo.length === 1) {
                mostrarToast(`⚠️ ALERTA: Es el último tóner ${tonerActual.marca} ${tonerActual.modelo}. ¡Reabastecer!`, 'warning')
            }

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
        } finally {
            submittingRef.current = false
            setSubmitting(false)
        }
    }

    const generarActa = async (asignacion) => {
        try {
            const personaRecibe = personas.find(p => p.id === asignacion.persona_id)
            const entregaPersonaId = asignacion.entregado_por || entregadoPor
            const entregador = personas.find(p => p.id === entregaPersonaId)
            const toner = toners.find(t => t.id === asignacion.toner_id)
            const impresora = impresoras.find(i => i.id === asignacion.impresora_id)
            const ambiente = ambientes.find(a => a.id === asignacion.ambiente_id)

            const doc = await createActaTonerPdf({ asignacion, personaRecibe, entregador, toner, impresora, ambiente })

            doc.save(`Acta_Toner_${asignacion.numero_acta || 'NUEVA'}.pdf`)

            try {
                const blob = doc.output('blob')
                const fileName = `toners/Acta_Toner_${asignacion.numero_acta || 'NUEVA'}.pdf`

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

    const verHistorial = async (tonerId) => {
        try {
            const { data: tonerData } = await supabase
                .from('bienes').select('*, compra_detalle:compra_detalles(*)')
                .eq('id', tonerId).single()

            const { data: movimientos } = await supabase
                .from('toner_movimientos').select('*')
                .eq('toner_id', tonerId)
                .order('fecha', { ascending: true })

            const { data: rawAsignaciones } = await supabase
                .from('asignacion_toners').select('*')
                .eq('toner_id', tonerId)
                .order('fecha_asignacion', { ascending: true })

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

            const timeline = []
            const asignacionesActivasIds = new Set(asignaciones.map(a => a.id))

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

            const asignacionIdsEnMovimientos = new Set(
                (movimientos || [])
                    .filter(m => m.metadata?.asignacion_id)
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

    const filteredAsignaciones = asignaciones.filter(asig =>
        asig.toner?.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.toner?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.toner?.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.persona?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asig.impresora?.marca?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalPages = Math.max(1, Math.ceil(filteredAsignaciones.length / PAGE_SIZE))
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredAsignaciones.slice(start, start + PAGE_SIZE)
    }, [filteredAsignaciones, currentPage])

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages)
    }, [filteredAsignaciones.length])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    const tonersDisponibles = toners.filter(toner =>
        toner.estado !== 'Agotado' &&
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

    return {
        asignaciones, toners, impresoras, personas, ambientes, pisos,
        selectedPiso, setSelectedPiso, ambientesFiltrados,
        loading, searchTerm, setSearchTerm,
        openDrawer, setOpenDrawer, openDrawerToners,
        editMode, setEditMode,
        selectedAsignacion, setSelectedAsignacion,
        openTerminarModal, setOpenTerminarModal,
        terminarData, setTerminarData,
        openActaModal, setOpenActaModal,
        actaData, setActaData,
        openHistorialModal, setOpenHistorialModal,
        historialAsignaciones,
        formData, setFormData,
        selectedTonerPreview, stockMismoModelo,
        entregadoPor, setEntregadoPor,
        filteredAsignaciones, paginatedData, currentPage, setCurrentPage, totalPages, PAGE_SIZE, tonersDisponibles,
        getEstadoColor, calcularDuracion,
        cargarDatos, cargarImpresoras, mostrarToast,
        handleInputChange, handleSubmit, handleEdit, handleDelete, confirmDelete, devolverToner,
        deleteTarget, setDeleteTarget,
        submitting,
        handleTerminar, generarActaManual, verHistorial, resetForm,
    }
}
