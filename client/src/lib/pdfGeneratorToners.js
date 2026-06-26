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

    const LOGO_SIZE = 22
    const FONT = (doc.getFontList()['Outfit']) ? 'Outfit' : 'Helvetica'

    const fechaActual = new Date().toLocaleDateString('es-PE', {
        year: 'numeric', month: 'long', day: 'numeric'
    })

    const renderCopy = (x0, copyW, label, subtitle) => {
        const margin = 5
        const col1X = x0 + margin
        const rightEdge = x0 + copyW - margin
        const maxTextWidth = copyW - (margin * 2) // Ancho máximo permitido para el texto (120mm)

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

        // --- SECCIÓN TEXTO MEJORADO CON MAXWIDTH ---
        doc.setFont(FONT, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        
        const [anioStr, mesStr, diaStr] = asignacion.fecha_asignacion.split('-')
        const dia = parseInt(diaStr, 10)
        const anio = parseInt(anioStr, 10)
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']
        const mes = meses[parseInt(mesStr, 10) - 1]
        
        // Texto optimizado y fluido
        const textoIntroduccion = `En la ciudad de Cajamarca, el ${dia} de ${mes} de ${anio}, reunidos en la sede de la Unidad de Gestión Educativa Local de Cajamarca, ubicada en el Jr. Pisagua N° 466, se procede a la ENTREGA - RECEPCIÓN del siguiente bien consumible:`;
        
        // splitTextToSize calcula automáticamente los saltos de línea para que no se desborde
        const lineasIntro = doc.splitTextToSize(textoIntroduccion, maxTextWidth);
        doc.text(lineasIntro, col1X, y);
        
        // Calculamos dinámicamente el salto de 'y' según cuántas líneas tomó el texto anterior
        y += (lineasIntro.length * 4.2) + 3; 

        const tonerData = [
            ['Tipo', 'TÓNER'],
            ['Marca / Modelo', `${toner?.marca || ''} ${toner?.modelo || ''}`],
            ['Serie', toner?.serie || '-'],
            ['Color', toner?.color_toner || '-'],
            ['Rendimiento', toner?.rendimiento ? `${toner.rendimiento} págs` : '-'],
        ]

        autoTable(doc, {
            body: tonerData.map(([l, v]) => [l, v]),
            startY: y,
            theme: 'plain',
            styles: { font: FONT },
            bodyStyles: { fontSize: 8, cellPadding: { top: 1.8, bottom: 1.8, left: 0, right: 0 } },
            columnStyles: {
                0: { cellWidth: 38, fontStyle: 'bold', fontSize: 8 },
                1: { cellWidth: copyW - margin * 2 - 38, fontSize: 8 }
            },
            margin: { left: col1X, right: pageW - rightEdge },
            tableLineColor: 200,
            tableLineWidth: 0
        })

        y = doc.lastAutoTable.finalY + 5
        doc.setDrawColor(200, 200, 200)
        doc.line(col1X, y, rightEdge, y)
        y += 5

        doc.setFont(FONT, 'bold')
        doc.setFontSize(8)
        doc.setTextColor(50, 49, 48)

        if (impresora) {
            doc.text('Impresora Destino:', col1X, y)
            doc.setFont(FONT, 'normal')
            const impText = `${impresora.marca} ${impresora.modelo} - Serie: ${impresora.serie || 'N/A'}`
            doc.text(impText, col1X + 28, y)
            y += 5
        }

        doc.setFont(FONT, 'bold')
        if (ambiente) {
            const pisoNombre = ambiente.piso?.nombre || ''
            doc.text('Ubicación:', col1X, y)
            doc.setFont(FONT, 'normal')
            doc.text(`${ambiente.nombre}${pisoNombre ? ` (${pisoNombre})` : ''}`, col1X + 18, y)
            y += 5
        }

        y += 3
        doc.setDrawColor(200, 200, 200)
        doc.line(col1X, y, rightEdge, y)
        y += 6

        doc.setFont(FONT, 'bold')
        doc.setFontSize(9)
        doc.setTextColor(0, 120, 212)
        doc.text('DATOS DEL RESPONSABLE QUE RECIBE', col1X, y)
        y += 6
        doc.setFont(FONT, 'normal')
        doc.setFontSize(8)
        doc.setTextColor(50, 49, 48)
        doc.text(`${personaRecibe?.apellidos || ''}, ${personaRecibe?.nombres || ''} - DNI: ${personaRecibe?.dni || '-'}`, col1X, y)
        y += 5
        doc.text(`Cargo: ${personaRecibe?.cargo || '-'}`, col1X, y)

        y += 9
        doc.setDrawColor(200, 200, 200)
        doc.line(col1X, y, rightEdge, y)
        y += 5

        doc.setFont(FONT, 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(120, 120, 120)
        
        // También protegemos la NOTA con splitTextToSize por seguridad
        const notaText = 'NOTA: El presente tóner será utilizado única y exclusivamente en las funciones propias del cargo dentro de la sede institucional de la UGEL Cajamarca.';
        const lineasNota = doc.splitTextToSize(notaText, maxTextWidth);
        doc.text(lineasNota, col1X, y);
        
        y += (lineasNota.length * 3.5) + 12; // Ajustamos espacio dinámico antes de las firmas

        const sigLeft = col1X
        const sigRight = rightEdge - 45
        const sigWidth = 45

        doc.setDrawColor(50, 49, 48)
        doc.line(sigLeft, y, sigLeft + sigWidth, y)
        doc.setFont(FONT, 'bold')
        doc.setFontSize(8)
        doc.setTextColor(50, 49, 48)
        doc.text('ENTREGÓ CONFORME', sigLeft, y + 4.5)

        doc.line(sigRight, y, sigRight + sigWidth, y)
        doc.text('RECIBÍ CONFORME', sigRight, y + 4.5)

        doc.setFont(FONT, 'normal')
        doc.setFontSize(7)
        doc.setTextColor(80, 80, 80)
        doc.text(entregador ? `${entregador.apellidos}, ${entregador.nombres}` : 'Jose Maria Ramirez Vasquez', sigLeft, y + 11)
        doc.text(entregador?.cargo || 'Responsable de Oficina de Informática', sigLeft, y + 16)
        if (entregador?.dni) doc.text(`DNI: ${entregador.dni}`, sigLeft, y + 21)

        doc.text(personaRecibe ? `${personaRecibe.apellidos}, ${personaRecibe.nombres}` : '', sigRight, y + 11)
        doc.text(personaRecibe?.cargo || '', sigRight, y + 16)
        if (personaRecibe?.dni) doc.text(`DNI: ${personaRecibe.dni}`, sigRight, y + 21)

        // Enviamos la fecha al fondo del documento de forma segura
        doc.setFont(FONT, 'normal')
        doc.setFontSize(6)
        doc.setTextColor(150, 150, 150)
        doc.text(`Fecha de emisión: ${fechaActual}`, col1X, pageH - 6)
    }

    // Renderizado de las copias (Mantiene tus coordenadas perfectas)
    renderCopy(10, 130, 'ORIGINAL - Área de Informática', 'ACTA DE ENTREGA - RECEPCIÓN DE TÓNER')

    doc.setDrawColor(180, 180, 180)
    doc.setLineDashPattern([3, 3], 0)
    doc.line(pageW / 2, 0, pageW / 2, pageH)
    doc.setLineDashPattern([], 0)

    renderCopy(157, 130, 'CARGO - Servidor Público', 'CARGO DE ENTREGA DE TÓNER')

    return doc
}