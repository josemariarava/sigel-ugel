import { useState, useEffect, useRef } from 'react'
import {
    Button,
    Input,
    Textarea,
    Select,
    Card,
    Field,
    InfoLabel,
    Subtitle2,
    Divider,
    Caption1,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle,
    Badge,
    Spinner,
    Dialog,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@fluentui/react-components'
import {
    DismissRegular,
    ChevronDownRegular,
    EyeRegular,
    LaptopRegular,
    PrintRegular,
    CartRegular,
    DesktopRegular,
    ArrowSyncRegular,
    CheckmarkCircleRegular,
    TvRegular,        // ← Usar TvRegular en lugar de MonitorRegular
    WarningRegular
} from '@fluentui/react-icons'

const DrawerBien = ({
    open,
    onClose,
    editMode,
    formData,
    handleInputChange,
    handleSubmit,
    marcas,
    modelosFiltrados,
    diagnostico,
    diagnosticar,
    intentarAutoDetectarMonitor,
    monitoresDetectados,
    monitorSeleccionadoIndex,
    seleccionarMonitor,
    ambientes,
    resetForm
}) => {
    const [detectandoMonitores, setDetectandoMonitores] = useState(false)
    const [formDirty, setFormDirty] = useState(false)
    const [confirmClose, setConfirmClose] = useState(false)
    const initialFormRef = useRef(null)

    useEffect(() => {
        if (open) {
            initialFormRef.current = JSON.stringify(formData)
            setFormDirty(false)
        }
    }, [open])

    useEffect(() => {
        if (open && initialFormRef.current !== null) {
            setFormDirty(JSON.stringify(formData) !== initialFormRef.current)
        }
    }, [formData])

    const handleConfirmClose = () => {
        setConfirmClose(false)
        setFormDirty(false)
        initialFormRef.current = null
        onClose()
        resetForm()
    }

    const handleCancelClose = () => {
        setConfirmClose(false)
    }

    const handleDiagnosticarConLoading = async () => {
        setDetectandoMonitores(true)
        await intentarAutoDetectarMonitor()
        setDetectandoMonitores(false)
    }

    return (
        <Drawer
            position="end"
            open={open}
            onOpenChange={(_, data) => {
                if (!data.open) {
                    if (formDirty) {
                        setConfirmClose(true)
                    } else {
                        onClose()
                        resetForm()
                    }
                }
            }}
            style={{ width: '100%', maxWidth: '1100px' }}
        >
            <DrawerHeader className="border-b border-gray-100 pb-2 bg-gradient-to-r from-blue-50 to-white">
                <DrawerHeaderTitle
                    action={
                        <Button
                            appearance="subtle"
                            aria-label="Close"
                            icon={<DismissRegular />}
                            onClick={onClose}
                        />
                    }
                >
                    <div>
                        <span className="text-lg font-bold text-slate-800">
                            {editMode ? '✏️ Editar Registro Patrimonial' : '📝 Añadir Nuevo Bien al Sistema'}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">Complete los datos del equipo o bien patrimonial</p>
                    </div>
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="flex flex-col lg:flex-row p-0 lg:overflow-hidden overflow-y-auto">

                {/* COLUMNA IZQUIERDA: EL FORMULARIO */}
                <div className="w-full lg:w-7/12 p-6 flex flex-col gap-5 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-100">

                    {/* Grupo 1 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                        <Subtitle2 className="text-blue-600 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                            1. Información General del Equipo
                        </Subtitle2>

                        <Divider />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                            <Field label="Tipo de Equipo" required>
                                <Select name="tipo_equipo" value={formData.tipo_equipo} onChange={handleInputChange} style={{ width: '100%' }}>
                                    <option value="">Seleccionar tipo...</option>
                                    <optgroup label="🖥️ Equipos de Cómputo">
                                        <option value="Laptop">💻 Laptop</option>
                                        <option value="Desktop">🖥️ Desktop</option>
                                        <option value="CPU">📦 CPU</option>
                                        <option value="Tablet">📱 Tablet</option>
                                        <option value="All-in-One">🖥️ All-in-One</option>
                                    </optgroup>
                                    <optgroup label="🖨️ Impresoras y Proyectores">
                                        <option value="Impresora">🖨️ Impresora</option>
                                        <option value="Multifuncional">📠 Multifuncional</option>
                                        <option value="Proyector">📽️ Proyector</option>
                                        <option value="Escáner">🔍 Escáner</option>
                                        <option value="Plotter">📐 Plotter</option>
                                    </optgroup>
                                    <optgroup label="⌨️ Periféricos">
                                        <option value="Monitor">🖥️ Monitor</option>
                                        <option value="Teclado">⌨️ Teclado</option>
                                        <option value="Mouse">🖱️ Mouse</option>
                                        <option value="Parlantes">🔊 Parlantes</option>
                                        <option value="Router">📡 Router</option>
                                        <option value="Switch">🔌 Switch</option>
                                    </optgroup>
                                    <optgroup label="🧴 Consumibles">
                                        <option value="Tóner">🧴 Tóner</option>
                                        <option value="Cartucho">💦 Cartucho</option>
                                        <option value="Batería">🔋 Batería</option>
                                    </optgroup>
                                    <optgroup label="🔧 Otros">
                                        <option value="Otro">🔧 Otro</option>
                                    </optgroup>
                                </Select>
                            </Field>

                            <Field label={<InfoLabel info="Si se deja vacío, se auto-generará una serie (SIN-SERIE-...)">Número de Serie</InfoLabel>}>
                                <Input name="serie" value={formData.serie || ''} onChange={handleInputChange} placeholder="SN-12345XYZ" style={{ width: '100%' }} />
                            </Field>

                            <Field label="Marca" hint="Escribe para buscar en el catálogo o ingresa una nueva">
                                <Input
                                    name="marca"
                                    value={formData.marca || ''}
                                    onChange={handleInputChange}
                                    placeholder="Escribe o selecciona una marca..."
                                    list="marca-list"
                                    contentAfter={<ChevronDownRegular />}
                                />
                                <datalist id="marca-list">
                                    {marcas.map(m => (
                                        <option key={m.id} value={m.nombre} />
                                    ))}
                                </datalist>
                            </Field>

                            <Field label="Modelo" hint="Escribe para buscar en el catálogo o ingresa un nuevo">
                                {formData.marca_id ? (
                                    <>
                                        <Input
                                            name="modelo"
                                            value={formData.modelo || ''}
                                            onChange={handleInputChange}
                                            placeholder="Escribe o selecciona un modelo..."
                                            list="modelo-list"
                                            contentAfter={<ChevronDownRegular />}
                                        />
                                        <datalist id="modelo-list">
                                            {modelosFiltrados.map(m => (
                                                <option key={m.id} value={m.nombre} />
                                            ))}
                                        </datalist>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-400 italic py-1">Seleccione una marca primero</p>
                                )}
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                            {formData.tipo_equipo !== 'Tóner' && (
                                <Field label="Color" hint="Escribe para buscar o ingresa un nuevo color">
                                    <Input name="color" value={formData.color || ''} onChange={handleInputChange} placeholder="Buscar o escribir color..." list="color-suggestions" contentAfter={<ChevronDownRegular />} />
                                    <datalist id="color-suggestions">
                                        <option value="Negro" />
                                        <option value="Blanco" />
                                        <option value="Gris" />
                                        <option value="Azul" />
                                        <option value="Rojo" />
                                        <option value="Plateado" />
                                        <option value="Verde" />
                                        <option value="Beige" />
                                        <option value="Multicolor" />
                                    </datalist>
                                </Field>
                            )}

                            {formData.tipo_equipo === 'Monitor' && (
                                <Field label="Tamaño de Pantalla">
                                    <Input name="tamano_pantalla" value={formData.tamano_pantalla || ''} onChange={handleInputChange} placeholder='Ej. 21.5", 27", 32"' />
                                </Field>
                            )}
                        </div>

                        {/* Diagnóstico general para no-Monitores */}
                        {formData.tipo_equipo !== 'Monitor' && (
                            <div className="mt-1">
                                <button type="button" onClick={diagnosticar} className="text-xs text-gray-500 hover:text-blue-600 underline">
                                    🔍 Diagnosticar agentito
                                </button>
                                {diagnostico && !diagnostico.error && (
                                    <div className="mt-1 p-2 rounded text-xs border border-green-200 bg-green-50 text-green-800">
                                        <span className="font-semibold">✅ Agentito OK</span>
                                        <span className="ml-2 text-gray-500">| {diagnostico.usuario} @ {diagnostico.hostname}</span>
                                    </div>
                                )}
                                {diagnostico?.error && (
                                    <div className="mt-1 p-2 rounded text-xs border border-red-200 bg-red-50 text-red-700">
                                        {diagnostico.mensaje}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN PARA MONITORES */}
                    {formData.tipo_equipo === 'Monitor' && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    appearance="secondary"
                                    icon={detectandoMonitores ? <Spinner size="tiny" /> : <ArrowSyncRegular />}
                                    onClick={handleDiagnosticarConLoading}
                                    disabled={detectandoMonitores}
                                    size="small"
                                >
                                    {detectandoMonitores ? 'Detectando monitores...' : '🔍 Detectar monitores conectados'}
                                </Button>
                                
                                {diagnostico && !diagnostico.error && (
                                    <Badge appearance="tint" color="success" size="small">
                                        Agentito activo
                                    </Badge>
                                )}
                            </div>

                            {diagnostico?.error && (
                                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex items-center gap-2 text-red-700">
                                        <WarningRegular />
                                        <span className="text-sm font-medium">Agentito no disponible</span>
                                    </div>
                                    <p className="text-xs text-red-600 mt-1">{diagnostico.mensaje}</p>
                                </div>
                            )}

                            {monitoresDetectados.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Subtitle2 className="text-blue-600 flex items-center gap-1">
                                            <TvRegular />
                                            Monitores detectados ({monitoresDetectados.length})
                                        </Subtitle2>
                                        {monitoresDetectados.length > 1 && (
                                            <Caption1 className="text-amber-600">
                                                💡 Selecciona cuál monitor registrar
                                            </Caption1>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {monitoresDetectados.map((monitor, idx) => {
                                            const isSelected = monitorSeleccionadoIndex === idx
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => seleccionarMonitor(idx)}
                                                    className={`
                                                        p-3 rounded-lg cursor-pointer transition-all duration-200
                                                        border-2
                                                        ${isSelected 
                                                            ? 'bg-blue-50 border-blue-500 shadow-md' 
                                                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-gray-800">
                                                                    🖥️ Monitor {idx + 1}
                                                                </span>
                                                                {isSelected && (
                                                                    <Badge appearance="filled" color="brand" size="tiny">
                                                                        <CheckmarkCircleRegular className="w-3 h-3 inline mr-1" />
                                                                        Seleccionado
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                                {monitor.marca && (
                                                                    <>
                                                                        <span className="text-gray-500">Marca:</span>
                                                                        <span className="font-medium text-gray-800">{monitor.marca}</span>
                                                                    </>
                                                                )}
                                                                {monitor.modelo && (
                                                                    <>
                                                                        <span className="text-gray-500">Modelo:</span>
                                                                        <span className="font-medium text-gray-800">{monitor.modelo}</span>
                                                                    </>
                                                                )}
                                                                {monitor.serie && (
                                                                    <>
                                                                        <span className="text-gray-500">N° Serie:</span>
                                                                        <span className="font-mono text-xs text-gray-600">{monitor.serie}</span>
                                                                    </>
                                                                )}
                                                                {monitor.tamano_pantalla && (
                                                                    <>
                                                                        <span className="text-gray-500">Tamaño:</span>
                                                                        <span className="font-medium text-gray-800">{monitor.tamano_pantalla}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {isSelected && (
                                                            <div className="ml-2">
                                                                <CheckmarkCircleRegular className="w-6 h-6 text-blue-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    
                                    {monitoresDetectados.length > 1 && monitorSeleccionadoIndex === null && (
                                        <p className="text-xs text-amber-600 mt-2 text-center">
                                            ⚠️ Haz clic en un monitor para cargar sus datos en el formulario
                                        </p>
                                    )}
                                </div>
                            )}

                            {monitoresDetectados.length === 0 && diagnostico && !diagnostico.error && (
                                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <p className="text-sm text-yellow-700">
                                        📺 No se detectaron monitores conectados
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        Verifica que los monitores estén encendidos y conectados correctamente.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grupo específico para Tóner */}
                    {formData.tipo_equipo === 'Tóner' && (
                        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
                            <Subtitle2 className="text-amber-700 flex items-center gap-2 mb-3">
                                <CartRegular />
                                Datos específicos del Tóner
                            </Subtitle2>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Color del Tóner">
                                    <Select name="color_toner" value={formData.color_toner || ''} onChange={handleInputChange}>
                                        <option value="">Seleccionar color...</option>
                                        <option value="Negro">⚫ Negro</option>
                                        <option value="Cian">🔵 Cian</option>
                                        <option value="Magenta">🔴 Magenta</option>
                                        <option value="Amarillo">🟡 Amarillo</option>
                                    </Select>
                                </Field>
                                <Field label="Rendimiento (páginas)">
                                    <Input
                                        type="number"
                                        name="rendimiento"
                                        value={formData.rendimiento || ''}
                                        onChange={handleInputChange}
                                        placeholder="Ej. 1500 páginas"
                                    />
                                </Field>
                                <Field label="Número de Lote">
                                    <Input name="lote" value={formData.lote || ''} onChange={handleInputChange} placeholder="Lote de compra" />
                                </Field>
                                <Field label="Fecha Vencimiento">
                                    <Input name="fecha_vencimiento" type="date" value={formData.fecha_vencimiento || ''} onChange={handleInputChange} />
                                </Field>
                                <Field label="Proveedor">
                                    <Input name="proveedor" value={formData.proveedor || ''} onChange={handleInputChange} placeholder="Nombre del proveedor" />
                                </Field>
                                <Field label="Ubicación (Almacén)">
                                    <select
                                        name="ubicacion_almacen"
                                        value={formData.ubicacion_almacen || ''}
                                        onChange={handleInputChange}
                                        className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white"
                                    >
                                        <option value="">Seleccionar ubicación...</option>
                                        {ambientes.map(a => (
                                            <option key={a.id} value={a.nombre}>📍 {a.nombre}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* Grupo específico para Equipos de Cómputo */}
                    {['Laptop', 'Desktop', 'CPU', 'Tablet', 'All-in-One'].includes(formData.tipo_equipo) && (
                        <div className="bg-cyan-50 p-5 rounded-xl border border-cyan-200">
                            <Subtitle2 className="text-cyan-700 flex items-center gap-2 mb-3">
                                <LaptopRegular />
                                Especificaciones del Equipo
                            </Subtitle2>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Procesador">
                                    <Input name="procesador" value={formData.procesador || ''} onChange={handleInputChange} placeholder="Ej. Intel Core i5-12400" />
                                </Field>
                                <Field label="Memoria RAM">
                                    <Input name="ram" value={formData.ram || ''} onChange={handleInputChange} placeholder="Ej. 8 GB, 16 GB" />
                                </Field>
                                <Field label="Almacenamiento">
                                    <Input name="almacenamiento" value={formData.almacenamiento || ''} onChange={handleInputChange} placeholder="Ej. 256 GB, 512 GB" />
                                </Field>
                                <Field label="Tipo de Almacenamiento">
                                    <Input name="tipo_almacenamiento" value={formData.tipo_almacenamiento || ''} onChange={handleInputChange} placeholder="SSD, HDD, NVMe" />
                                </Field>
                                <Field label="Sistema Operativo">
                                    <Input name="sistema_operativo" value={formData.sistema_operativo || ''} onChange={handleInputChange} placeholder="Ej. Windows 11, Ubuntu 24.04" />
                                </Field>
                                <Field label="Dirección MAC">
                                    <Input name="direccion_mac" value={formData.direccion_mac || ''} onChange={handleInputChange} placeholder="Ej. 00:1A:2B:3C:4D:5E" />
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* Grupo 2 - Identificadores */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                        <Subtitle2 className="text-blue-600 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                            2. Identificadores Administrativos
                        </Subtitle2>
                        <Divider />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Código Patrimonial">
                                <Input name="codigo_patrimonial" value={formData.codigo_patrimonial || ''} onChange={handleInputChange} placeholder="742212340001" className="font-mono" />
                            </Field>
                            <Field label="Código TI Interno">
                                <Input name="codigo_ti" value={formData.codigo_ti || ''} onChange={handleInputChange} placeholder="UGEL-TI-045" className="font-mono" />
                            </Field>
                        </div>
                    </div>

                    {/* Grupo 3 - Logística */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                        <Subtitle2 className="text-blue-600 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                            3. Logística y Estados
                        </Subtitle2>
                        <Divider />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="Año Compra">
                                <Input type="number" name="anio_compra" value={formData.anio_compra || ''} onChange={handleInputChange} />
                            </Field>
                            <Field label="Valor (S/)">
                                <Input type="number" name="valor_compra" value={formData.valor_compra || ''} onChange={handleInputChange} placeholder="0.00" step="0.01" />
                            </Field>
                            <Field label="Orden Compra">
                                <Input name="orden_compra" value={formData.orden_compra || ''} onChange={handleInputChange} placeholder="O/C 2026-089" />
                            </Field>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {formData.tipo_equipo !== 'Tóner' && (
                                <Field label="Condición Física">
                                    <Select name="condicion" value={formData.condicion || ''} onChange={handleInputChange}>
                                        <option value="Bueno">✅ Bueno</option>
                                        <option value="Regular">⚠️ Regular</option>
                                        <option value="Malo">❌ Malo</option>
                                        <option value="Chatarra">🗑️ Chatarra</option>
                                    </Select>
                                </Field>
                            )}
                            <Field label="Estado Operativo">
                                <Select name="estado" value={formData.estado || ''} onChange={handleInputChange}>
                                    {formData.tipo_equipo === 'Tóner' ? (
                                        <>
                                            <option value="Disponible">🟢 Disponible</option>
                                            <option value="Asignado">🟠 Asignado</option>
                                            <option value="Agotado">🔴 Agotado</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Activo">🔵 Activo</option>
                                            <option value="Inactivo">⚪ Inactivo</option>
                                            <option value="Dado de Baja">⚫ Dado de Baja</option>
                                        </>
                                    )}
                                </Select>
                            </Field>
                        </div>
                    </div>

                    {/* Grupo 4 - Notas */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                        <Subtitle2 className="text-blue-600 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                            4. Notas Adicionales
                        </Subtitle2>
                        <Divider />
                        <Field label="Observaciones">
                            <Textarea name="other" value={formData.other || ''} onChange={handleInputChange} rows={3} placeholder="Detalles de entrega, componentes incluidos, incidencias..." />
                        </Field>
                    </div>
                </div>

                {/* COLUMNA DERECHA: VISTA PREVIA */}
                <div className="w-full lg:w-5/12 bg-gray-50 p-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-200">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <EyeRegular />
                            <Caption1 className="uppercase tracking-wider font-semibold">Vista Previa del Registro</Caption1>
                        </div>
                        <Card className="!p-5 bg-white border border-gray-200 shadow-sm flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
                                        {formData.tipo_equipo === 'Laptop' && <LaptopRegular style={{ fontSize: '28px' }} />}
                                        {formData.tipo_equipo === 'Impresora' && <PrintRegular style={{ fontSize: '28px' }} />}
                                        {formData.tipo_equipo === 'Monitor' && <TvRegular style={{ fontSize: '28px' }} />}
                                        {formData.tipo_equipo === 'Tóner' && <CartRegular style={{ fontSize: '28px' }} />}
                                        {!['Laptop', 'Impresora', 'Monitor', 'Tóner'].includes(formData.tipo_equipo) && <DesktopRegular style={{ fontSize: '28px' }} />}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-800 m-0">
                                            {formData.tipo_equipo || 'Nuevo Equipo'}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {formData.marca || 'Marca'} — {formData.modelo || 'Modelo'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${formData.condicion === 'Bueno' ? 'bg-green-100 text-green-800' :
                                    formData.condicion === 'Regular' ? 'bg-amber-100 text-amber-800' :
                                        formData.condicion === 'Chatarra' ? 'bg-gray-200 text-gray-700' :
                                            'bg-rose-100 text-rose-800'
                                    }`}>
                                    {formData.condicion || 'Pendiente'}
                                </span>
                            </div>
                            <Divider />
                            <div className="grid grid-cols-2 gap-x-2 gap-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Cód. Patrimonial</span>
                                    <span className="font-mono text-xs text-gray-700 font-semibold truncate block">
                                        {formData.codigo_patrimonial || 'No asignado'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Código TI Interno</span>
                                    <span className="font-mono text-xs text-gray-700 font-semibold truncate block">
                                        {formData.codigo_ti || 'No asignado'}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 text-xs">
                                <p className="text-gray-500">N° de Serie:</p>
                                <p className="font-mono text-right text-gray-800 font-medium truncate">{formData.serie || '—'}</p>
                                <p className="text-gray-500">Color:</p>
                                <p className="text-right text-gray-800 font-medium">{formData.color || formData.color_toner || '—'}</p>
                                {formData.tipo_equipo === 'Monitor' && (
                                    <>
                                        <p className="text-gray-500">Tamaño:</p>
                                        <p className="text-right text-gray-800 font-medium">{formData.tamano_pantalla || '—'}</p>
                                    </>
                                )}
                                <p className="text-gray-500">Año de Adquisición:</p>
                                <p className="text-right text-gray-800 font-medium">{formData.anio_compra || '—'}</p>
                                <p className="text-gray-500">Costo Unitario:</p>
                                <p className="text-right font-semibold text-gray-900">
                                    {formData.valor_compra ? `S/ ${parseFloat(formData.valor_compra).toFixed(2)}` : 'S/ 0.00'}
                                </p>
                            </div>
                            {['Laptop', 'Desktop', 'CPU', 'Tablet', 'All-in-One'].includes(formData.tipo_equipo) && (
                                <>
                                    <Divider />
                                    <div className="bg-cyan-50 p-2 rounded-lg">
                                        <p className="text-[10px] uppercase font-bold text-cyan-600 block mb-2">💻 Especificaciones del Equipo</p>
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            <span className="text-gray-500">Procesador:</span>
                                            <span className="text-right font-medium">{formData.procesador || '—'}</span>
                                            <span className="text-gray-500">RAM:</span>
                                            <span className="text-right font-medium">{formData.ram || '—'}</span>
                                            <span className="text-gray-500">Almacenamiento:</span>
                                            <span className="text-right font-medium">{formData.almacenamiento || '—'}</span>
                                            <span className="text-gray-500">Tipo Disco:</span>
                                            <span className="text-right font-medium">{formData.tipo_almacenamiento || '—'}</span>
                                            <span className="text-gray-500">Sistema Operativo:</span>
                                            <span className="text-right font-medium">{formData.sistema_operativo || '—'}</span>
                                            <span className="text-gray-500">Dirección MAC:</span>
                                            <span className="text-right font-medium">{formData.direccion_mac || '—'}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                            {formData.tipo_equipo === 'Tóner' && (
                                <>
                                    <Divider />
                                    <div className="bg-amber-50 p-2 rounded-lg">
                                        <p className="text-[10px] uppercase font-bold text-amber-600 block mb-2">🧴 Datos del Consumible</p>
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            <span className="text-gray-500">Color:</span>
                                            <span className="text-right font-medium">{formData.color_toner || '—'}</span>
                                            <span className="text-gray-500">Rendimiento:</span>
                                            <span className="text-right font-medium">{formData.rendimiento || '—'} páginas</span>
                                            <span className="text-gray-500">Lote:</span>
                                            <span className="text-right font-medium">{formData.lote || '—'}</span>
                                            <span className="text-gray-500">Proveedor:</span>
                                            <span className="text-right font-medium">{formData.proveedor || '—'}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                            <Divider />
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Observaciones</span>
                                <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100 max-h-20 overflow-y-auto">
                                    {formData.other || 'Sin observaciones registradas.'}
                                </p>
                            </div>
                        </Card>
                    </div>
                    <div className="flex gap-2 justify-end bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 mt-4">
                        <Button appearance="secondary" onClick={onClose}>Cancelar</Button>
                        <Button appearance="primary" onClick={handleSubmit}>
                            {editMode ? 'Actualizar Registro' : 'Confirmar Guardado'}
                        </Button>
                    </div>
                </div>

            </DrawerBody>
            <Dialog open={confirmClose} onOpenChange={(_, d) => setConfirmClose(d.open)}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>¿Descartar cambios?</DialogTitle>
                        <DialogContent>
                            Hay cambios sin guardar. Si cierras ahora, se perderán los datos modificados.
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={handleCancelClose}>
                                Seguir editando
                            </Button>
                            <Button appearance="primary" onClick={handleConfirmClose}>
                                Descartar cambios
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </Drawer>
    )
}

export default DrawerBien