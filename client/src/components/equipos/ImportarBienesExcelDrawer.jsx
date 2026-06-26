import { useState, useRef, useMemo } from 'react'
import {
    Button,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Badge,
    Spinner,
    Select,
    MessageBar,
    MessageBarBody
} from '@fluentui/react-components'
import {
    DismissRegular,
    DocumentRegular,
    ArrowUploadRegular,
    CheckmarkCircleRegular,
    ErrorCircleRegular,
    DismissCircleRegular,
    ClipboardRegular,
    BoxRegular,
    AddRegular
} from '@fluentui/react-icons'

const KNOWN_FIELDS = {
    tipo_equipo: ['tipo equipo', 'tipo', 'tipo_equipo', 'equipo', 'tipoequipo', 'tipodeequipo'],
    marca: ['marca', 'brand', 'mrc'],
    modelo: ['modelo', 'model', 'mdl'],
    serie: ['serie', 'serial', 'n° serie', 'numero serie', 'número serie', 'no serie', 'nro serie', 'numerodeserie', 'nserie'],
    codigo_patrimonial: ['codigo patrimonial', 'código patrimonial', 'cod_patrimonial', 'codigo_patrimonial', 'cod_pat', 'codigopatrimonial', 'código', 'codigo', 'codigodepatrimonial'],
    orden_compra: ['orden compra', 'orden_compra', 'oc', 'n° oc', 'no oc', 'numero oc', 'nro oc', 'ordendecompra'],
    razon_social: ['razon social', 'razón social', 'razon_social', 'razonsocial', 'proveedor', 'proveed', 'vendor', 'provedor'],
    ruc: ['ruc', 'RUC'],
    direccion: ['dirección', 'direccion', 'address'],
    mes_calendario: ['mes calendario', 'mes_calendario', 'mes', 'calendario', 'mescalendario'],
    fecha_compra: ['fecha compra', 'fecha_compra', 'fecha', 'fecha de compra', 'feccompra', 'fechadecompra'],
    costo_unitario: ['costo', 'costo unitario', 'costo_unitario', 'valor', 'precio', 'precio unitario', 'costounitario', 'preciounitario', 'costoxunidad'],
    condicion: ['condición', 'condicion', 'estado físico', 'state', 'cond'],
    procesador: ['procesador', 'cpu', 'processor', 'proc'],
    ram: ['ram', 'memoria', 'memory'],
    almacenamiento: ['almacenamiento', 'disco', 'storage', 'hd', 'disco duro', 'almac'],
    tipo_almacenamiento: ['tipo almacenamiento', 'tipo_almacenamiento', 'tipo disco', 'tipoalmacenamiento', 'tipodealmacenamiento'],
    sistema_operativo: ['sistema operativo', 'sistema_operativo', 'so', 'os', 'sistema', 'sistemaoperativo'],
    tamano_pantalla: ['tamaño pantalla', 'tamano_pantalla', 'pantalla', 'screen size', 'pulgadas', 'tamanopantalla', 'tamanodepantalla'],
    direccion_mac: ['dirección mac', 'direccion_mac', 'mac', 'mac address', 'direccionmac'],
    other: ['observaciones', 'notas', 'comentarios', 'other', 'otros', 'obs'],
    color: ['color']
}

const TEMPLATE_HEADERS = [
    'Tipo', 'Marca', 'Modelo', 'Serie', 'Código Patrimonial',
    'Orden Compra', 'Razón Social', 'RUC', 'Dirección', 'Mes Calendario',
    'Fecha Compra', 'Costo Unitario',
    'Condición', 'Procesador', 'RAM', 'Almacenamiento',
    'Tipo Almacenamiento', 'Sistema Operativo', 'Tamaño Pantalla',
    'Dirección MAC', 'Color', 'Observaciones'
]

const parseExcelDate = (val) => {
    if (!val) return ''
    if (typeof val === 'number') {
        const d = new Date((val - 25569) * 86400 * 1000)
        return d.toISOString().split('T')[0]
    }
    const str = String(val).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
    const parts = str.split(/[\/\-\.]/)
    if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
        if (parts[2].length === 4) {
            const day = parseInt(parts[0], 10)
            const month = parseInt(parts[1], 10)
            if (day > 12) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
            if (month > 12) return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
    }
    return str
}

const normalizeHeader = (h) => String(h).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_\-\s]+/g, '')

const autoDetectColumns = (headers) => {
    const mapping = {}
    const fieldKeys = Object.keys(KNOWN_FIELDS)
    for (const h of headers) {
        const norm = normalizeHeader(h)
        let matched = false
        for (const fk of fieldKeys) {
            if (KNOWN_FIELDS[fk].some(alias => normalizeHeader(alias) === norm)) {
                mapping[h] = fk
                matched = true
                break
            }
        }
        if (!matched) mapping[h] = null
    }
    return mapping
}

const ImportarBienesExcelDrawer = ({ open, onClose, onImport }) => {
    const fileInputRef = useRef(null)
    const [step, setStep] = useState('upload')
    const [fileName, setFileName] = useState('')
    const [rawData, setRawData] = useState([])
    const [columnMapping, setColumnMapping] = useState({})
    const [headers, setHeaders] = useState([])
    const [importing, setImporting] = useState(false)
    const [result, setResult] = useState(null)

    const reset = () => {
        setStep('upload')
        setFileName('')
        setRawData([])
        setColumnMapping({})
        setHeaders([])
        setImporting(false)
        setResult(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    const descargarPlantilla = async () => {
        try {
            const XLSX = await import('xlsx')
            const data = [
                TEMPLATE_HEADERS.reduce((acc, h) => ({ ...acc, [h]: '' }), {}),
                {
                    'Tipo': 'Laptop',
                    'Marca': 'Lenovo',
                    'Modelo': 'ThinkPad X1',
                    'Serie': 'SN-2026-001',
                    'Código Patrimonial': 'P-2026-001',
                    'Orden Compra': 'OC-2026-001',
                    'Razón Social': 'Distribuidora Tecnológica S.A.',
                    'RUC': '20123456789',
                    'Dirección': 'Av. Principal 123, Lima',
                    'Mes Calendario': 'Enero 2026',
                    'Fecha Compra': '2026-01-15',
                    'Costo Unitario': 3500.00,
                    'Condición': 'Bueno',
                    'Procesador': 'Intel Core i5 12va gen',
                    'RAM': '16 GB',
                    'Almacenamiento': '512 GB SSD',
                    'Tipo Almacenamiento': 'SSD',
                    'Sistema Operativo': 'Windows 11 Pro',
                    'Tamaño Pantalla': '14 pulgadas',
                    'Dirección MAC': 'AA:BB:CC:DD:EE:01',
                    'Color': 'Negro',
                    'Observaciones': ''
                },
                {
                    'Tipo': 'Monitor',
                    'Marca': 'Samsung',
                    'Modelo': 'LF24T350FHL',
                    'Serie': 'MON-2026-001',
                    'Código Patrimonial': 'P-2026-002',
                    'Orden Compra': '',
                    'Fecha Compra': '',
                    'Costo Unitario': 850.00,
                    'Condición': 'Bueno',
                    'Procesador': '',
                    'RAM': '',
                    'Almacenamiento': '',
                    'Tipo Almacenamiento': '',
                    'Sistema Operativo': '',
                    'Tamaño Pantalla': '24 pulgadas',
                    'Dirección MAC': '',
                    'Color': 'Negro',
                    'Observaciones': 'Monitor de oficina'
                }
            ]
            const ws = XLSX.utils.json_to_sheet(data)
            ws['!cols'] = [
                { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 22 },
                { wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 14 },
                { wch: 14 }, { wch: 10 }, { wch: 16 },
                { wch: 20 }, { wch: 20 }, { wch: 18 },
                { wch: 24 }, { wch: 12 }, { wch: 24 }
            ]
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
            XLSX.writeFile(wb, 'plantilla_importar_bienes.xlsx')
        } catch (err) {
            console.error('Error al descargar plantilla:', err.message)
        }
    }

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        setResult(null)

        try {
            const XLSX = await import('xlsx')
            const buffer = await file.arrayBuffer()
            const workbook = XLSX.read(buffer, { type: 'array' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })

            if (json.length === 0) {
                setResult({ type: 'error', message: 'El archivo no contiene datos.' })
                return
            }

            const h = Object.keys(json[0])
            const mapping = autoDetectColumns(h)

            // check which required fields are missing
            const hasTipo = Object.values(mapping).includes('tipo_equipo')
            const hasSerie = Object.values(mapping).includes('serie')

            setHeaders(h)
            setColumnMapping(mapping)
            setRawData(json)
            setStep('preview')

            if (!hasTipo || !hasSerie) {
                setResult({
                    type: 'warning',
                    message: `No se detectaron columnas ${!hasTipo ? '"tipo_equipo"' : ''}${!hasTipo && !hasSerie ? ' ni ' : ''}${!hasSerie ? '"serie"' : ''}. Los datos podrían estar incompletos.`
                })
            }
        } catch (err) {
            setResult({ type: 'error', message: `Error al leer el archivo: ${err.message}` })
        }
    }

    const getFieldValue = (row, field) => {
        for (const h of headers) {
            if (columnMapping[h] === field) {
                return row[h]
            }
        }
        return ''
    }

    const getUnmappedColumns = () => headers.filter(h => columnMapping[h] === null)

    const getOCCount = () => {
        const ocs = new Set()
        let withoutOC = 0
        for (const row of rawData) {
            const oc = String(getFieldValue(row, 'orden_compra') || '').trim()
            if (oc) ocs.add(oc)
            else withoutOC++
        }
        return { count: ocs.size, list: [...ocs], withoutOC }
    }

    const getStatsForPreview = () => {
        const total = rawData.length
        const ocInfo = getOCCount()
        const unmapped = getUnmappedColumns()
        const withMapping = headers.filter(h => columnMapping[h] !== null)

        let missingTipo = 0
        let missingSerie = 0
        for (const row of rawData) {
            if (!String(getFieldValue(row, 'tipo_equipo') || '').trim()) missingTipo++
            if (!String(getFieldValue(row, 'serie') || '').trim()) missingSerie++
        }

        return { total, ocInfo, unmapped, withMapping, missingTipo, missingSerie }
    }

    const getDisplayRow = (row) => {
        const r = {}
        for (const f of Object.values(columnMapping).filter(Boolean)) {
            r[f] = getFieldValue(row, f)
        }
        return r
    }

    const rowsWithErrors = useMemo(() => {
        const result = []
        // Detectar series duplicadas dentro del Excel
        const serieCount = {}
        for (let i = 0; i < rawData.length; i++) {
            const s = String(getFieldValue(rawData[i], 'serie') || '').trim().toLowerCase()
            if (s) serieCount[s] = (serieCount[s] || 0) + 1
        }
        const seriesDuplicadas = new Set(
            Object.entries(serieCount).filter(([, c]) => c > 1).map(([s]) => s)
        )
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i]
            const errors = []
            if (!String(getFieldValue(row, 'tipo_equipo') || '').trim()) errors.push('tipo_equipo')
            const s = String(getFieldValue(row, 'serie') || '').trim().toLowerCase()
            if (s && seriesDuplicadas.has(s)) errors.push('serie_duplicada')
            if (errors.length > 0) result.push({ index: i, errors })
        }
        return result
    }, [rawData, columnMapping, headers])

    const getRowErrors = (row) => {
        const idx = rawData.indexOf(row)
        if (idx === -1) return []
        const found = rowsWithErrors.find(r => r.index === idx)
        return found ? found.errors : []
    }

    const hasBlockingErrors = rowsWithErrors.length > 0

    const handleImport = async () => {
        setImporting(true)
        setResult(null)
        try {
            const rows = rawData.map(row => {
                const mapped = {}
                for (const h of headers) {
                    const field = columnMapping[h]
                    if (field) {
                        let val = row[h]
                        if (field === 'fecha_compra') val = parseExcelDate(val)
                        if (field === 'costo_unitario' && val !== '' && val != null) {
                            const cleaned = String(val).trim().replace(/[^0-9.,]/g, '')
                            const lastDot = cleaned.lastIndexOf('.')
                            const lastComma = cleaned.lastIndexOf(',')
                            if (lastDot > lastComma) {
                                val = parseFloat(cleaned.replace(/,/g, '')) || 0
                            } else if (lastComma > lastDot) {
                                val = parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0
                            } else {
                                val = parseFloat(cleaned) || 0
                            }
                        }
                        mapped[field] = val
                    }
                }
                return mapped
            })

            const { success, count, conOC = 0, sinOC = 0, codigosDuplicados = 0, errors = [] } = await onImport(rows)
            if (!success || errors.length > 0) {
                setResult({
                    type: 'warning',
                    message: `Importado ${count} registro(s) con ${errors.length} error(es).`,
                    detail: errors.slice(0, 5).join('; ')
                })
            } else {
                const parts = []
                if (conOC > 0) parts.push(`${conOC} con O/C`)
                if (sinOC > 0) parts.push(`${sinOC} sin O/C`)
                if (codigosDuplicados > 0) parts.push(`${codigosDuplicados} código(s) patrimonial(es) duplicado(s) — se importaron sin código patrimonial`)
                const detalle = parts.length > 0 ? ` (${parts.join(', ')})` : ''
                setResult({
                    type: 'success',
                    message: `${count} registro(s) importados correctamente${detalle}`
                })
            }
            reset()
        } catch (err) {
            setResult({ type: 'error', message: `Error en la importación: ${err.message}` })
        } finally {
            setImporting(false)
        }
    }

    const updateMapping = (header, field) => {
        setColumnMapping(prev => ({ ...prev, [header]: field || null }))
    }

    const previewStats = step === 'preview' ? getStatsForPreview() : null

    return (
        <Drawer
            position="end"
            open={open}
            onOpenChange={(_, data) => {
                if (!data.open) handleClose()
            }}
            style={{ width: '100%', maxWidth: '1000px' }}
        >
            <DrawerHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <DrawerHeaderTitle
                    action={
                        <Button
                            appearance="subtle"
                            icon={<DismissRegular />}
                            onClick={handleClose}
                        />
                    }
                >
                    <div className="flex items-center gap-2">
                        <ArrowUploadRegular className="text-emerald-600 text-xl" />
                        <div>
                            <span className="text-lg font-bold text-slate-800">
                                Importar Bienes desde Excel
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Sube un archivo Excel con los datos de los equipos. Se agruparán automáticamente por orden de compra.
                            </p>
                        </div>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                {/* Result message */}
                {result && (
                    <MessageBar
                        intent={result.type === 'success' ? 'success' : result.type === 'warning' ? 'warning' : 'error'}
                    >
                        <MessageBarBody>
                            <b>{result.message}</b>
                            {result.detail && <p className="text-xs mt-0.5 opacity-80">{result.detail}</p>}
                        </MessageBarBody>
                    </MessageBar>
                )}

                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <>
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <DocumentRegular className="text-4xl text-gray-400 mb-3" />
                            <p className="text-gray-600 font-medium">Haz clic para seleccionar un archivo Excel</p>
                            <p className="text-xs text-gray-400 mt-1">Formatos: .xlsx, .xls</p>
                        </div>
                        <div className="text-center">
                            <Button
                                appearance="subtle"
                                icon={<DocumentRegular />}
                                onClick={descargarPlantilla}
                                size="small"
                                className="text-blue-600"
                            >
                                Descargar plantilla de ejemplo
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 2: Preview */}
                {step === 'preview' && (
                    <div className="space-y-4 relative">
                        {importing && (
                            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl" style={{ minHeight: '400px' }}>
                                <Spinner size="large" />
                                <p className="mt-4 text-sm font-medium text-gray-600">Importando datos, por favor espera...</p>
                                <p className="text-xs text-gray-400 mt-1">Procesando {rawData.length} registro(s) y agrupando por orden de compra</p>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge appearance="filled" color="brand" size="large">{previewStats.total}</Badge>
                                <span className="text-sm text-gray-600">filas detectadas</span>
                                <span className="text-gray-300 mx-1">|</span>
                                <Badge appearance="filled" color="seafoam" size="large">{previewStats.ocInfo.count}</Badge>
                                <span className="text-sm text-gray-600">OC(s) diferente(s)</span>
                                {previewStats.ocInfo.withoutOC > 0 && (
                                    <>
                                        <span className="text-gray-300 mx-1">|</span>
                                        <Badge appearance="filled" color="informative" size="large">{previewStats.ocInfo.withoutOC}</Badge>
                                        <span className="text-sm text-gray-600">sin OC</span>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button appearance="subtle" size="small" onClick={() => { reset(); setStep('upload') }}>
                                    Cambiar archivo
                                </Button>
                            </div>
                        </div>

                        {/* Column Mapping */}
                        {headers.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Mapeo de columnas detectado</p>
                                <div className="flex flex-wrap gap-2">
                                    {headers.map(h => (
                                        <div key={h} className="flex items-center gap-1 text-xs">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">{h}</span>
                                            <span className="text-gray-400">→</span>
                                            <Select
                                                value={columnMapping[h] || ''}
                                                onChange={(e, data) => updateMapping(h, data.value)}
                                                className="text-xs min-w-[130px]"
                                                size="small"
                                            >
                                                <option value="">— ignorar —</option>
                                                {Object.keys(KNOWN_FIELDS).map(f => (
                                                    <option key={f} value={f}>{f}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Blocking errors */}
                        {hasBlockingErrors && (
                            <MessageBar intent="error">
                                <MessageBarBody>
                                    <b className="block">{rowsWithErrors.length} fila(s) tienen errores</b>
                                    <span className="text-xs">Corrige los datos en tu Excel o ajusta el mapeo de columnas antes de importar.</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {rowsWithErrors.slice(0, 10).map(({ index, errors }) => (
                                            <span key={index} className="inline-flex items-center gap-1 bg-red-100 px-2 py-0.5 rounded text-xs font-mono">
                                                #{index + 1}: {errors.map(e => e === 'serie_duplicada' ? 'serie repetida' : e).join(', ')}
                                            </span>
                                        ))}
                                        {rowsWithErrors.length > 10 && (
                                            <span className="text-xs text-red-500">... y {rowsWithErrors.length - 10} más</span>
                                        )}
                                    </div>
                                </MessageBarBody>
                            </MessageBar>
                        )}

                        {/* Preview Table */}
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHeaderCell>#</TableHeaderCell>
                                        <TableHeaderCell>Tipo</TableHeaderCell>
                                        <TableHeaderCell>Marca</TableHeaderCell>
                                        <TableHeaderCell>Modelo</TableHeaderCell>
                                        <TableHeaderCell>Serie</TableHeaderCell>
                                        <TableHeaderCell>Cód. Pat.</TableHeaderCell>
                                        <TableHeaderCell>O/C</TableHeaderCell>
                                        <TableHeaderCell>Razón Social</TableHeaderCell>
                                        <TableHeaderCell>Costo</TableHeaderCell>
                                        <TableHeaderCell>Condición</TableHeaderCell>
                                        {hasBlockingErrors && <TableHeaderCell>Errores</TableHeaderCell>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rawData.slice(0, 100).map((row, i) => {
                                        const display = getDisplayRow(row)
                                        const errors = getRowErrors(row)
                                        const hasErrors = errors.length > 0
                                        return (
                                            <TableRow key={i} className={`hover:bg-gray-50 ${hasErrors ? 'bg-red-50 border-l-4 border-l-red-400' : ''}`}>
                                                <TableCell className={`text-xs ${hasErrors ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{i + 1}</TableCell>
                                                <TableCell className="text-xs">{display.tipo_equipo || <span className="text-red-500 font-semibold">FALTA</span>}</TableCell>
                                                <TableCell className="text-xs">{display.marca || <span className="text-gray-400">—</span>}</TableCell>
                                                <TableCell className="text-xs">{display.modelo || <span className="text-gray-400">—</span>}</TableCell>
                                                <TableCell className="text-xs font-mono">{display.serie || <span className="text-gray-400 italic">SIN-SERIE (auto)</span>}</TableCell>
                                                <TableCell className="text-xs font-mono">{display.codigo_patrimonial || <span className="text-gray-400">—</span>}</TableCell>
                                                <TableCell className="text-xs">{display.orden_compra || <span className="text-gray-400">—</span>}</TableCell>
                                                <TableCell className="text-xs">{display.razon_social || <span className="text-gray-400">—</span>}</TableCell>
                                                <TableCell className="text-xs">{display.costo_unitario || <span className="text-gray-400">—</span>}</TableCell>
                                                <TableCell className="text-xs">{display.condicion || <span className="text-gray-400">—</span>}</TableCell>
                                                {hasBlockingErrors && (
                                                    <TableCell className="text-xs">
                                                        {hasErrors ? (
                                                            <span className="text-red-600 font-medium text-[10px] whitespace-nowrap">
                                                                {errors.join(', ')}
                                                            </span>
                                                        ) : (
                                                            <CheckmarkCircleRegular className="text-emerald-600 text-sm" />
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        )
                                    })}
                                    {rawData.length > 100 && (
                                        <TableRow>
                                            <TableCell colSpan={hasBlockingErrors ? 12 : 11} className="text-center text-xs text-gray-400 py-3">
                                                ... y {rawData.length - 100} fila(s) más
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* OC Summary */}
                        <MessageBar intent="info">
                            <MessageBarBody>
                                <b className="block mb-1">Resumen de ordenes de compra</b>
                                <div className="space-y-1 text-sm">
                                    {previewStats.ocInfo.list.length > 0 && (
                                        <p>
                                            <AddRegular className="inline-block mr-1 align-text-bottom" />
                                            Se crearán <strong>{previewStats.ocInfo.count}</strong> orden(es) de compra nuevas: {previewStats.ocInfo.list.join(', ')}
                                        </p>
                                    )}
                                    {previewStats.ocInfo.withoutOC > 0 && (
                                        <p>
                                            <BoxRegular className="inline-block mr-1 align-text-bottom" />
                                            {previewStats.ocInfo.withoutOC} equipo(s) sin OC se registrarán como bienes sueltos
                                        </p>
                                    )}
                                </div>
                            </MessageBarBody>
                        </MessageBar>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button appearance="secondary" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button
                                appearance="primary"
                                icon={<ArrowUploadRegular />}
                                onClick={handleImport}
                                disabled={importing || hasBlockingErrors}
                            >
                                {importing ? 'Importando...' : hasBlockingErrors ? 'Corrige errores antes de importar' : `Importar ${rawData.length} registro(s)`}
                            </Button>
                        </div>
                    </div>
                )}
            </DrawerBody>
        </Drawer>
    )
}

export default ImportarBienesExcelDrawer
