import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function createActaTonerPdf({ asignacion, personaRecibe, entregador, toner, impresora, ambiente }) {
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

    const fechaAsignacion = new Date(asignacion.fecha_asignacion)

    const renderCopy = (x0, copyW, label, subtitle) => {
        const margin = 5
        const col1X = x0 + margin
        const rightEdge = x0 + copyW - margin
        const contentW = copyW - margin * 2

        doc.setFillColor(0, 120, 212)
        doc.rect(x0, 0, copyW, 3, 'F')

        let y = 6

        if (logoImg) {
            doc.addImage(logoImg, 'PNG', rightEdge - LOGO_SIZE, 4, LOGO_SIZE, LOGO_SIZE)
        }

        doc.setFont(FONT, 'bold')
        doc.setFontSize(9)
        doc.setTextColor(0, 120, 212)
        doc.text(label, col1X, y)

        y += 9
        doc.setFont(FONT, 'bold')
        doc.setFontSize(13)
        doc.setTextColor(32, 31, 30)
        doc.text(subtitle, col1X, y)

        y += 7
        doc.setFont(FONT, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(96, 94, 92)
        doc.text(`Acta N°: ${asignacion.numero_acta || 'PENDIENTE'}`, col1X, y)

        y += 6
        doc.setDrawColor(200, 200, 200)
        doc.line(col1X, y, rightEdge, y)
        y += 5

        doc.setFont(FONT, 'normal')
        doc.setFontSize(8)
        doc.setTextColor(50, 49, 48)
        const dia = fechaAsignacion.getDate()
        const mes = fechaAsignacion.toLocaleString('es-PE', { month: 'long' })
        const anio = fechaAsignacion.getFullYear()
        doc.text(`En la ciudad de Cajamarca, a los ${dia} días del mes de ${mes} de ${anio},`, col1X, y)
        y += 4.5
        doc.text('reunidos en el local de la Unidad de Gestión Educativa Local de Cajamarca, sito en el Jr. Pisagua N° 466,', col1X, y)
        y += 4.5
        doc.text('se procede a realizar la ENTREGA - RECEPCIÓN del siguiente bien consumible:', col1X, y)
        y += 6

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
            headStyles: { fillColor: [0, 120, 212], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 7.5, cellPadding: 2 },
            margin: { left: col1X, right: pageW - rightEdge }
        })

        y = doc.lastAutoTable.finalY + 4

        doc.setFont(FONT, 'bold')
        doc.setFontSize(8)
        doc.setTextColor(50, 49, 48)

        if (impresora) {
            doc.text(`Impresora Destino:  `, col1X, y)
            doc.setFont(FONT, 'normal')
            doc.text(`${impresora.marca} ${impresora.modelo} - Serie: ${impresora.serie || 'N/A'}`, col1X + 28, y)
            y += 5
        }

        doc.setFont(FONT, 'bold')
        if (ambiente) {
            const pisoNombre = ambiente.piso?.nombre || ''
            doc.text(`Ubicación:  `, col1X, y)
            doc.setFont(FONT, 'normal')
            doc.text(`${ambiente.nombre}${pisoNombre ? ` (${pisoNombre})` : ''}`, col1X + 16, y)
            y += 5
        }

        y += 2
        doc.setDrawColor(200, 200, 200)
        doc.line(col1X, y, rightEdge, y)
        y += 5

        doc.setFont(FONT, 'bold')
        doc.setFontSize(8)
        doc.setTextColor(0, 120, 212)
        doc.text('DATOS DEL RESPONSABLE QUE RECIBE', col1X, y)
        y += 5
        doc.setFont(FONT, 'normal')
        doc.setFontSize(8)
        doc.setTextColor(50, 49, 48)
        doc.text(`${personaRecibe?.apellidos || ''}, ${personaRecibe?.nombres || ''} - DNI: ${personaRecibe?.dni || '-'}`, col1X, y)
        y += 4.5
        doc.text(`Cargo: ${personaRecibe?.cargo || '-'}`, col1X, y)

        y += 8
        doc.setDrawColor(200, 200, 200)
        doc.line(col1X, y, rightEdge, y)
        y += 5

        doc.setFont(FONT, 'normal')
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.text('NOTA: El presente tóner será utilizado única y exclusivamente en las funciones propias del cargo', col1X, y)
        y += 3.5
        doc.text('dentro de la sede institucional de la UGEL Cajamarca.', col1X, y)
        y += 10

        const sigLeft = col1X
        const sigRight = rightEdge - 42
        const sigWidth = 42

        doc.setDrawColor(50, 49, 48)
        doc.line(sigLeft, y, sigLeft + sigWidth, y)
        doc.setFont(FONT, 'bold')
        doc.setFontSize(8)
        doc.setTextColor(50, 49, 48)
        doc.text('ENTREGÓ CONFORME', sigLeft, y + 4)

        doc.line(sigRight, y, sigRight + sigWidth, y)
        doc.text('RECIBÍ CONFORME', sigRight, y + 4)

        doc.setFont(FONT, 'normal')
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.text(entregador ? `${entregador.apellidos}, ${entregador.nombres}` : 'Fredy Arturo García Torres', sigLeft, y + 9.5)
        doc.text(entregador?.cargo || 'Responsable de Oficina de Informática', sigLeft, y + 13.5)
        if (entregador?.dni) doc.text(`DNI: ${entregador.dni}`, sigLeft, y + 17.5)

        doc.text(personaRecibe ? `${personaRecibe.apellidos}, ${personaRecibe.nombres}` : '', sigRight, y + 9.5)
        doc.text(personaRecibe?.cargo || '', sigRight, y + 13.5)
        if (personaRecibe?.dni) doc.text(`DNI: ${personaRecibe.dni}`, sigRight, y + 17.5)

        y += 14
        doc.setFont(FONT, 'normal')
        doc.setFontSize(6)
        doc.setTextColor(150, 150, 150)
        doc.text(`Fecha de emisión: ${fechaActual}`, col1X, y)
    }

    renderCopy(10, 130, 'ORIGINAL - Área de Informática', 'ACTA DE ENTREGA - RECEPCIÓN DE TÓNER')

    doc.setDrawColor(180, 180, 180)
    doc.setLineDashPattern([3, 3], 0)
    doc.line(pageW / 2, 0, pageW / 2, pageH)
    doc.setLineDashPattern([], 0)

    renderCopy(157, 130, 'CARGO - Servidor Público', 'CARGO DE ENTREGA DE TÓNER')

    return doc
}
