import {
    Button,
    Input,
    Textarea,
    Select,
    Card,
    Field,
    Subtitle2,
    Divider,
    Caption1,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle,
} from '@fluentui/react-components'
import {
    DismissRegular,
    EyeRegular,
    LaptopRegular,
    PrintRegular,
    CartRegular,
    DesktopRegular,
} from '@fluentui/react-icons'

const DrawerBien = ({
    open,
    onClose,
    editMode,
    formData,
    handleInputChange,
    handleSubmit,
    marcas,
    modelos,
    modelosFiltrados,
    marcaManual,
    setMarcaManual,
    ambientes,
    resetForm
}) => {
    return (
        <Drawer
            position="end"
            open={open}
            onOpenChange={(_, data) => {
                if (!data.open) {
                    onClose()
                }
            }}
            style={{ width: "1100px" }}
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

            <DrawerBody className="flex p-0 overflow-hidden">

                {/* COLUMNA IZQUIERDA: EL FORMULARIO */}
                <div className="w-7/12 p-6 overflow-y-auto border-r border-gray-100 flex flex-col gap-5 h-full" style={{ maxHeight: 'calc(100vh - 100px)' }}>

                    {/* Grupo 1 */}
                    <div className="flex flex-col gap-3">
                        <Subtitle2 className="text-blue-600 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                            1. Detalles del Hardware
                        </Subtitle2>
                        <Divider />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Tipo de Equipo" required>
                                <Select name="tipo_equipo" value={formData.tipo_equipo} onChange={handleInputChange}>
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

                            <Field label="Número de Serie">
                                <Input name="serie" value={formData.serie || ''} onChange={handleInputChange} placeholder="SN-12345XYZ" />
                            </Field>

                            <Field label="Marca">
                                {formData.tipo_equipo === 'Tóner' && !marcaManual ? (
                                    <div className="space-y-1">
                                        <select name="marca_id" value={formData.marca_id || ''} onChange={handleInputChange} className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white">
                                            <option value="">-- Seleccionar Marca --</option>
                                            {marcas.map(m => (
                                                <option key={m.id} value={m.id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={() => setMarcaManual(true)} className="text-xs text-blue-600 hover:underline">
                                            ✏️ Escribir manualmente
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <Input name="marca" value={formData.marca || ''} onChange={handleInputChange} placeholder="HP, Lenovo, Epson" />
                                        {formData.tipo_equipo === 'Tóner' && (
                                            <button type="button" onClick={() => setMarcaManual(false)} className="text-xs text-blue-600 hover:underline">
                                                📋 Usar catálogo
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Field>

                            <Field label="Modelo">
                                {formData.tipo_equipo === 'Tóner' && !marcaManual && formData.marca_id ? (
                                    <div className="space-y-1">
                                        <select name="modelo_id" value={formData.modelo_id || ''} onChange={handleInputChange} className="w-full text-sm border rounded-lg px-3 py-2.5 bg-white">
                                            <option value="">-- Seleccionar Modelo --</option>
                                            {modelosFiltrados.map(m => (
                                                <option key={m.id} value={m.id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <Input name="modelo" value={formData.modelo || ''} onChange={handleInputChange} placeholder="ThinkPad E14, LaserJet Pro" />
                                )}
                            </Field>

                            {formData.tipo_equipo !== 'Tóner' && (
                                <Field label="Color">
                                    <Input name="color" value={formData.color || ''} onChange={handleInputChange} placeholder="Buscar o escribir color..." list="color-suggestions" />
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

                        </div>
                    </div>

                    {/* Grupo específico para Tóner */}
                    {formData.tipo_equipo === 'Tóner' && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
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

                    {/* Grupo 2 */}
                    <div className="flex flex-col gap-3">
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

                    {/* Grupo 3 */}
                    <div className="flex flex-col gap-3">
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
                                    <Select name="condicion" value={formData.condicion} onChange={handleInputChange}>
                                        <option value="Bueno">✅ Bueno</option>
                                        <option value="Regular">⚠️ Regular</option>
                                        <option value="Malo">❌ Malo</option>
                                        <option value="Chatarra">🗑️ Chatarra</option>
                                    </Select>
                                </Field>
                            )}

                            <Field label="Estado Operativo">
                                <Select name="estado" value={formData.estado} onChange={handleInputChange}>
                                    {formData.tipo_equipo === 'Tóner' ? (
                                        <>
                                            <option value="Disponible">🟢 Disponible</option>
                                            <option value="Asignado">🟠 Asignado</option>
                                            <option value="Agotado">🔴 Agotado</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Activo">🔵 Activo</option>
                                            <option value="Dado de Baja">⚪ Dado de Baja</option>
                                        </>
                                    )}
                                </Select>
                            </Field>
                        </div>
                    </div>

                    {/* Grupo 4 */}
                    <div className="flex flex-col gap-3">
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

                {/* COLUMNA DERECHA: VISTA PREVIA DINÁMICA */}
                <div className="w-5/12 bg-gray-50 p-6 flex flex-col justify-between h-full border-l border-gray-200">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <EyeRegular />
                            <Caption1 className="uppercase tracking-wider font-semibold">Vista Previa del Registro</Caption1>
                        </div>

                        {/* Tarjeta de visualización final */}
                        <Card className="!p-5 bg-white border border-gray-200 shadow-sm flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
                                        {formData.tipo_equipo === 'Laptop' && <LaptopRegular style={{ fontSize: '28px' }} />}
                                        {formData.tipo_equipo === 'Impresora' && <PrintRegular style={{ fontSize: '28px' }} />}
                                        {formData.tipo_equipo === 'Tóner' && <CartRegular style={{ fontSize: '28px' }} />}
                                        {!['Laptop', 'Impresora', 'Tóner'].includes(formData.tipo_equipo) && <DesktopRegular style={{ fontSize: '28px' }} />}
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

                            {/* Códigos Principales */}
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

                            {/* Características Técnicas */}
                            <div className="grid grid-cols-2 gap-y-2 text-xs">
                                <p className="text-gray-500">N° de Serie:</p>
                                <p className="font-mono text-right text-gray-800 font-medium truncate">{formData.serie || '—'}</p>

                                <p className="text-gray-500">Color:</p>
                                <p className="text-right text-gray-800 font-medium">{formData.color || formData.color_toner || '—'}</p>

                                <p className="text-gray-500">Año de Adquisición:</p>
                                <p className="text-right text-gray-800 font-medium">{formData.anio_compra || '—'}</p>

                                <p className="text-gray-500">Costo Unitario:</p>
                                <p className="text-right font-semibold text-gray-900">
                                    {formData.valor_compra ? `S/ ${parseFloat(formData.valor_compra).toFixed(2)}` : 'S/ 0.00'}
                                </p>
                            </div>

                            {/* Datos específicos de Tóner en vista previa */}
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
                                            {formData.fecha_vencimiento && (
                                                <>
                                                    <span className="text-gray-500">Vencimiento:</span>
                                                    <span className="text-right font-medium">{formData.fecha_vencimiento}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            <Divider />

                            {/* Notas */}
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Observaciones</span>
                                <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100 max-h-20 overflow-y-auto">
                                    {formData.other || 'Sin observaciones registradas.'}
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex gap-2 justify-end bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 mt-4">
                        <Button appearance="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button appearance="primary" onClick={handleSubmit}>
                            {editMode ? 'Actualizar Registro' : 'Confirmar Guardado'}
                        </Button>
                    </div>
                </div>

            </DrawerBody>
        </Drawer>
    )
}

export default DrawerBien
