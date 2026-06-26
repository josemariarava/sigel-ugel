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

export async function createActaAsignacionPdf({ asignacion }) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.width
    const pageH = doc.internal.pageSize.height

    const loadFonts = async () => {
        try {
            const [regResp, boldResp] = await Promise.all([
                fetch('/fonts/Outfit-Regular.ttf'),
                fetch('/fonts/Outfit-Bold.ttf')
            ])
            const [regBuf, boldBuf] = await Promise.all([
                regResp.arrayBuffer(),
                boldResp.arrayBuffer()
            ])
            const toB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)))
            doc.addFileToVFS('Outfit-Regular.ttf', toB64(regBuf))
            doc.addFont('Outfit-Regular.ttf', 'Outfit', 'normal')
            doc.addFileToVFS('Outfit-Bold.ttf', toB64(boldBuf))
            doc.addFont('Outfit-Bold.ttf', 'Outfit', 'bold')
        } catch {
            console.warn('No se pudo cargar Outfit, usando Helvetica')
        }
    }
    await loadFonts()

    let logoImg = null
    try {
        logoImg = new Image()
        logoImg.src = '/images/logo-ugel.png'
        await logoImg.decode()
    } catch {
        console.warn('No se pudo cargar el logo')
    }

    const LOGO_SIZE = 18
    const FONT = (doc.getFontList()['Outfit']) ? 'Outfit' : 'Helvetica'

    const fechaActual = new Date().toLocaleDateString('es-PE', {
        year: 'numeric', month: 'long', day: 'numeric'
    })

    const bien = asignacion.bien || {}
    const persona = asignacion.persona || {}

    const bienData = [
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

    const renderCopy = (x0, label, title) => {
        const margin = 5
        const col1X = x0 + margin
        const copyW = 130
        const rightEdge = x0 + copyW - margin

        doc.setFillColor(0, 120, 212)
        doc.rect(x0, 0, copyW, 3, 'F')

        let y = 6
        let labelX = col1X

        if (logoImg) {
            doc.addImage(logoImg, 'PNG', rightEdge - LOGO_SIZE, 4, LOGO_SIZE, LOGO_SIZE)
        }

        doc.setFont(FONT, 'bold')
        doc.setFontSize(9)
        doc.setTextColor(0, 120, 212)
        doc.text(label, labelX, y)

        y += 9
        doc.setFont(FONT, 'bold')
        doc.setFontSize(13)
        doc.setTextColor(32, 31, 30)
        doc.text(title, col1X, y)

        y += 7
        doc.setFont(FONT, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(96, 94, 92)
        doc.text(`Acta N°: ${asignacion.numero_acta || 'PENDIENTE'}`, col1X, y)

        y += 6
        doc.setDrawColor(200, 200, 200)
        doc.line(col1X, y, rightEdge, y)
        y += 5

        doc.setFont(FONT, 'bold')
        doc.setFontSize(9)
        doc.setTextColor(0, 120, 212)
        doc.text('DATOS DEL RESPONSABLE', col1X, y)

        y += 5.5
        doc.setFont(FONT, 'normal')
        doc.setFontSize(8)
        doc.setTextColor(50, 49, 48)
        doc.text(`Nombres: ${persona.nombres || ''} ${persona.apellidos || ''}`, col1X, y)
        y += 4.5
        doc.text(`DNI: ${persona.dni || '-'}`, col1X, y)
        y += 4.5
        doc.text(`Cargo: ${persona.cargo || '-'}`, col1X, y)

        y += 10
        doc.setFont(FONT, 'bold')
        doc.setFontSize(9)
        doc.setTextColor(0, 120, 212)
        doc.text('BIEN ASIGNADO', col1X, y)

        y += 2
        autoTable(doc, {
            body: bienData.map(([label, value]) => [label, value]),
            startY: y,
            theme: 'plain',
            styles: { font: FONT },
            bodyStyles: { fontSize: 8, cellPadding: { top: 1.8, bottom: 1.8, left: 0, right: 0 } },
            columnStyles: {
                0: { cellWidth: 42, fontStyle: 'bold', fontSize: 8 },
                1: { cellWidth: copyW - margin * 2 - 42, fontSize: 8 }
            },
            margin: { left: col1X, right: pageW - rightEdge },
            tableLineColor: 200,
            tableLineWidth: 0
        })

        y = doc.lastAutoTable.finalY + 5
        doc.setDrawColor(200, 200, 200)
        doc.line(col1X, y, rightEdge, y)
        y += 18

        doc.setFont(FONT, 'normal')
        doc.setFontSize(8)
        doc.setTextColor(50, 49, 48)
        doc.line(col1X, y, col1X + 42, y)
        doc.setFont(FONT, 'normal')
        doc.setFontSize(7)
        doc.setTextColor(96, 94, 92)
        doc.text('Firma del Responsable', col1X, y + 4)

        doc.line(rightEdge - 42, y, rightEdge, y)
        doc.text('Recibí Conforme', rightEdge - 42, y + 4)

        y += 10
        doc.setFont(FONT, 'normal')
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(`Fecha de emisión: ${fechaActual}`, col1X, y)
    }

    renderCopy(10, 'ORIGINAL - Área de Informática', 'ACTA DE ASIGNACIÓN DE BIEN')

    doc.setDrawColor(180, 180, 180)
    doc.setLineDashPattern([3, 3], 0)
    doc.line(pageW / 2, 0, pageW / 2, pageH)
    doc.setLineDashPattern([], 0)

    renderCopy(157, 'CARGO - Servidor Público', 'CARGO DE ASIGNACIÓN')

    return doc
}
