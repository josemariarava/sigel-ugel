import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function createActaCargoPdf({ personaNombre, personaApellidos, personaData, bienesPersona }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const fechaActual = new Date().toLocaleDateString('es-PE', {
        year: 'numeric', month: 'long', day: 'numeric'
    })

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
        headStyles: { fillColor: [0, 120, 212], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, cellPadding: 3 }
    })

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

    return doc
}

export function createActaAsignacionPdf({ asignacion }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const fechaActual = new Date().toLocaleDateString('es-PE', {
        year: 'numeric', month: 'long', day: 'numeric'
    })

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

    return doc
}
