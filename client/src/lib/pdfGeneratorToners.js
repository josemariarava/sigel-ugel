import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function createActaTonerPdf({ asignacion, personaRecibe, entregador, toner, impresora, ambiente }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const fechaActual = new Date().toLocaleDateString('es-PE', {
        year: 'numeric', month: 'long', day: 'numeric'
    })

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('ACTA DE ENTREGA - RECEPCIÓN DE TÓNER', 105, 25, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('Helvetica', 'normal')
    doc.text(`Acta N°: ${asignacion.numero_acta || 'PENDIENTE'}`, 105, 35, { align: 'center' })

    doc.setFontSize(10)
    let y = 50

    doc.text(`En la ciudad de Cajamarca, a los ${new Date(asignacion.fecha_asignacion).getDate()} días del mes de ${new Date(asignacion.fecha_asignacion).toLocaleString('es-PE', { month: 'long' })} de ${new Date(asignacion.fecha_asignacion).getFullYear()},`, 20, y)
    y += 7
    doc.text(`reunidos en el local de la Unidad de Gestión Educativa Local de Cajamarca, sito en el Jr. Pisagua N° 466,`, 20, y)
    y += 7
    doc.text(`se procede a realizar la ENTREGA - RECEPCIÓN del siguiente bien consumible:`, 20, y)
    y += 10

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
        headStyles: { fillColor: [0, 120, 212], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, cellPadding: 3 }
    })

    y = doc.lastAutoTable.finalY + 10

    if (impresora) {
        doc.setFont('Helvetica', 'bold')
        doc.text('Impresora Destino:', 20, y)
        doc.setFont('Helvetica', 'normal')
        doc.text(`${impresora.marca} ${impresora.modelo} - Serie: ${impresora.serie || 'N/A'}`, 20, y + 7)
        y += 20
    }

    if (ambiente) {
        const pisoNombre = ambiente.piso?.nombre || ''
        doc.text(`Ubicación: ${ambiente.nombre}${pisoNombre ? ` (${pisoNombre})` : ''}`, 20, y)
        y += 10
    }

    doc.setFont('Helvetica', 'bold')
    doc.text('Responsable que Recibe:', 20, y)
    doc.setFont('Helvetica', 'normal')
    doc.text(`${personaRecibe?.apellidos || ''}, ${personaRecibe?.nombres || ''} - DNI: ${personaRecibe?.dni || '-'}`, 20, y + 7)
    doc.text(`Cargo: ${personaRecibe?.cargo || '-'}`, 20, y + 14)
    y += 30

    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('NOTA: El presente tóner será utilizado única y exclusivamente en las funciones propias del cargo', 20, y)
    doc.text('dentro de la sede institucional de la UGEL Cajamarca.', 20, y + 6)
    y += 20

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)

    doc.line(30, y, 80, y)
    doc.text('ENTREGÓ CONFORME', 45, y + 5)

    doc.line(120, y, 170, y)
    doc.text('RECIBÍ CONFORME', 135, y + 5)

    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(entregador ? `${entregador.apellidos}, ${entregador.nombres}` : 'Fredy Arturo García Torres', 45, y + 12)
    doc.text(entregador?.cargo || 'Responsable de Oficina de Informática', 42, y + 17)
    doc.text(entregador?.dni ? `DNI: ${entregador.dni}` : 'DNI: 45715753', 55, y + 22)

    return doc
}
