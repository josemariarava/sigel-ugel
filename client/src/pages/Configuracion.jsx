import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleApiError } from '../lib/errorHandler'
import {
    AddRegular,
    EditRegular,
    DeleteRegular,
    DismissRegular,
    ArrowSyncRegular,
    BuildingRegular
} from '@fluentui/react-icons'
import {
    Button,
    Input,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Card,
    Field,
    useToastController,
    Toast,
    ToastTitle,
    ToastBody,
    Toaster,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerHeaderTitle,
    Badge,
    Tooltip,
    Subtitle2
} from '@fluentui/react-components'

const Configuracion = () => {
    const [marcas, setMarcas] = useState([])
    const [modelos, setModelos] = useState([])
    const [selectedMarca, setSelectedMarca] = useState(null)
    const [loading, setLoading] = useState(true)
    const [openMarcaDrawer, setOpenMarcaDrawer] = useState(false)
    const [openModeloDrawer, setOpenModeloDrawer] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [marcaForm, setMarcaForm] = useState({ nombre: '' })
    const [modeloForm, setModeloForm] = useState({ marca_id: '', nombre: '' })

    const { dispatchToast } = useToastController()

    const mostrarToast = (mensaje, tipo = 'success') => {
        dispatchToast(
            <Toast>
                <ToastTitle>{tipo === 'success' ? '✅ Éxito' : '❌ Error'}</ToastTitle>
                <ToastBody>{mensaje}</ToastBody>
            </Toast>,
            { intent: tipo }
        )
    }

    const cargarMarcas = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('marcas')
                .select('*')
                .order('nombre')
            if (error) throw error
            setMarcas(data || [])
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar marcas'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const cargarModelos = async (marcaId) => {
        try {
            const { data, error } = await supabase
                .from('modelos')
                .select('*')
                .eq('marca_id', marcaId)
                .order('nombre')
            if (error) throw error
            setModelos(data || [])
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar modelos'), 'error')
        }
    }

    useEffect(() => {
        cargarMarcas()
    }, [])

    const cargarDatosPorDefecto = async () => {
        const marcasPorDefecto = [
            {
                nombre: 'HP',
                modelos: ['CF283A', 'CF226X', 'CF280X', 'CE285A', 'CF410X', 'CF500X', 'CF510X', 'W1330A']
            },
            {
                nombre: 'Brother',
                modelos: ['TN3479', 'TN3428', 'TN2270', 'TN730', 'TN760', 'TN850', 'TN2430']
            },
            {
                nombre: 'Xerox',
                modelos: ['006R01731', '006R01772', '006R01773', '006R01272', '006R03412']
            },
            {
                nombre: 'Epson',
                modelos: ['T129', 'T544', 'T664', 'T673', 'T674']
            },
            {
                nombre: 'Samsung',
                modelos: ['MLT-D101S', 'MLT-D111S', 'MLT-D205L']
            },
            {
                nombre: 'Canon',
                modelos: ['045H', '054H', '057H', '067H']
            },
            {
                nombre: 'Panasonic',
                modelos: ['KX-FAD', 'KX-FAC', 'KX-FAT']
            }
        ]

        try {
            for (const m of marcasPorDefecto) {
                const { data: marca, error: errM } = await supabase
                    .from('marcas')
                    .insert({ nombre: m.nombre })
                    .select()
                    .single()

                if (errM) {
                    if (errM.code === '23505') continue // duplicado
                    throw errM
                }

                if (marca && m.modelos.length > 0) {
                    const modelosData = m.modelos.map(nom => ({
                        marca_id: marca.id,
                        nombre: nom
                    }))
                    const { error: errMod } = await supabase
                        .from('modelos')
                        .insert(modelosData)
                    if (errMod && errMod.code !== '23505') throw errMod
                }
            }

            mostrarToast('Datos por defecto cargados correctamente')
            cargarMarcas()
            if (selectedMarca) {
                cargarModelos(selectedMarca.id)
            }
        } catch (error) {
            mostrarToast(handleApiError(error, 'cargar datos por defecto'), 'error')
        }
    }

    const seleccionarMarca = (marca) => {
        setSelectedMarca(marca)
        cargarModelos(marca.id)
    }

    // CRUD MARCAS
    const abrirNuevaMarca = () => {
        setEditMode(false)
        setMarcaForm({ nombre: '' })
        setOpenMarcaDrawer(true)
    }

    const abrirEditarMarca = (marca) => {
        setEditMode(true)
        setMarcaForm({ nombre: marca.nombre, id: marca.id })
        setOpenMarcaDrawer(true)
    }

    const guardarMarca = async () => {
        if (!marcaForm.nombre.trim()) {
            mostrarToast('El nombre de la marca es obligatorio', 'error')
            return
        }
        try {
            if (editMode) {
                const { error } = await supabase
                    .from('marcas')
                    .update({ nombre: marcaForm.nombre.trim() })
                    .eq('id', marcaForm.id)
                if (error) throw error
                mostrarToast('Marca actualizada correctamente')
            } else {
                const { error } = await supabase
                    .from('marcas')
                    .insert({ nombre: marcaForm.nombre.trim() })
                if (error) {
                    if (error.code === '23505') {
                        mostrarToast('Ya existe una marca con ese nombre', 'error')
                        return
                    }
                    throw error
                }
                mostrarToast('Marca creada correctamente')
            }
            setOpenMarcaDrawer(false)
            cargarMarcas()
        } catch (error) {
            mostrarToast(handleApiError(error, 'guardar marca'), 'error')
        }
    }

    const eliminarMarca = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta marca? También se eliminarán sus modelos asociados.')) return
        try {
            const { error } = await supabase
                .from('marcas')
                .delete()
                .eq('id', id)
            if (error) throw error
            mostrarToast('Marca eliminada correctamente')
            if (selectedMarca?.id === id) {
                setSelectedMarca(null)
                setModelos([])
            }
            cargarMarcas()
        } catch (error) {
            mostrarToast(handleApiError(error, 'eliminar marca'), 'error')
        }
    }

    // CRUD MODELOS
    const abrirNuevoModelo = () => {
        if (!selectedMarca) {
            mostrarToast('Selecciona una marca primero', 'error')
            return
        }
        setEditMode(false)
        setModeloForm({ nombre: '', marca_id: selectedMarca.id })
        setOpenModeloDrawer(true)
    }

    const abrirEditarModelo = (modelo) => {
        setEditMode(true)
        setModeloForm({ nombre: modelo.nombre, id: modelo.id, marca_id: modelo.marca_id })
        setOpenModeloDrawer(true)
    }

    const guardarModelo = async () => {
        if (!modeloForm.nombre.trim()) {
            mostrarToast('El nombre del modelo es obligatorio', 'error')
            return
        }
        try {
            if (editMode) {
                const { error } = await supabase
                    .from('modelos')
                    .update({ nombre: modeloForm.nombre.trim() })
                    .eq('id', modeloForm.id)
                if (error) throw error
                mostrarToast('Modelo actualizado correctamente')
            } else {
                const { error } = await supabase
                    .from('modelos')
                    .insert({ nombre: modeloForm.nombre.trim(), marca_id: modeloForm.marca_id })
                if (error) {
                    if (error.code === '23505') {
                        mostrarToast('Ya existe un modelo con ese nombre en esta marca', 'error')
                        return
                    }
                    throw error
                }
                mostrarToast('Modelo creado correctamente')
            }
            setOpenModeloDrawer(false)
            cargarModelos(selectedMarca.id)
        } catch (error) {
            mostrarToast(handleApiError(error, 'guardar modelo'), 'error')
        }
    }

    const eliminarModelo = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este modelo?')) return
        try {
            const { error } = await supabase
                .from('modelos')
                .delete()
                .eq('id', id)
            if (error) throw error
            mostrarToast('Modelo eliminado correctamente')
            cargarModelos(selectedMarca.id)
        } catch (error) {
            mostrarToast(handleApiError(error, 'eliminar modelo'), 'error')
        }
    }

    return (
        <div className="p-1 space-y-6">
            <Toaster />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Catálogo de marcas y modelos de tóneres</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        appearance="subtle"
                        icon={<ArrowSyncRegular />}
                        onClick={cargarDatosPorDefecto}
                    >
                        Cargar datos por defecto
                    </Button>
                    <Button
                        appearance="primary"
                        icon={<AddRegular />}
                        onClick={abrirNuevaMarca}
                    >
                        Nueva Marca
                    </Button>
                </div>
            </div>

            {/* Marcas */}
            <Card className="!p-0 overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <Subtitle2>Marcas registradas</Subtitle2>
                    <Badge appearance="filled" color="brand" size="small">{marcas.length}</Badge>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Cargando...
                    </div>
                ) : (
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell><span className="font-semibold">Marca</span></TableHeaderCell>
                                <TableHeaderCell><span className="font-semibold">Acciones</span></TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {marcas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                                        No hay marcas registradas. Crea una o carga datos por defecto.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                marcas.map((marca) => (
                                    <TableRow
                                        key={marca.id}
                                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedMarca?.id === marca.id ? 'bg-blue-50' : ''}`}
                                        onClick={() => seleccionarMarca(marca)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <BuildingRegular className="text-gray-400" />
                                                <span className="font-medium">{marca.nombre}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Tooltip content="Editar marca" relationship="label">
                                                    <Button
                                                        appearance="subtle"
                                                        icon={<EditRegular />}
                                                        onClick={() => abrirEditarMarca(marca)}
                                                        size="small"
                                                    />
                                                </Tooltip>
                                                <Tooltip content="Eliminar marca" relationship="label">
                                                    <Button
                                                        appearance="subtle"
                                                        icon={<DeleteRegular />}
                                                        onClick={() => eliminarMarca(marca.id)}
                                                        size="small"
                                                    />
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Modelos */}
            {selectedMarca && (
                <Card className="!p-0 overflow-hidden">
                    <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                        <Subtitle2>Modelos de <span className="text-blue-600">{selectedMarca.nombre}</span></Subtitle2>
                        <div className="flex gap-2 items-center">
                            <Badge appearance="filled" color="brand" size="small">{modelos.length}</Badge>
                            <Button
                                appearance="primary"
                                icon={<AddRegular />}
                                onClick={abrirNuevoModelo}
                                size="small"
                            >
                                Nuevo Modelo
                            </Button>
                        </div>
                    </div>
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell><span className="font-semibold">Modelo</span></TableHeaderCell>
                                <TableHeaderCell><span className="font-semibold">Acciones</span></TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {modelos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                                        No hay modelos para esta marca.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                modelos.map((modelo) => (
                                    <TableRow key={modelo.id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell>{modelo.nombre}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Tooltip content="Editar modelo" relationship="label">
                                                    <Button
                                                        appearance="subtle"
                                                        icon={<EditRegular />}
                                                        onClick={() => abrirEditarModelo(modelo)}
                                                        size="small"
                                                    />
                                                </Tooltip>
                                                <Tooltip content="Eliminar modelo" relationship="label">
                                                    <Button
                                                        appearance="subtle"
                                                        icon={<DeleteRegular />}
                                                        onClick={() => eliminarModelo(modelo.id)}
                                                        size="small"
                                                    />
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Drawer Marca */}
            <Drawer position="end" open={openMarcaDrawer} onOpenChange={(_, data) => setOpenMarcaDrawer(data.open)}>
                <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenMarcaDrawer(false)} />}>
                        <span className="text-lg font-bold text-slate-800">
                            {editMode ? '✏️ Editar Marca' : '📝 Nueva Marca'}
                        </span>
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody className="p-6 space-y-4">
                    <Field label="Nombre de la Marca" required>
                        <Input
                            value={marcaForm.nombre}
                            onChange={(e) => setMarcaForm({ ...marcaForm, nombre: e.target.value })}
                            placeholder="Ej. HP, Brother, Xerox"
                        />
                    </Field>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button appearance="secondary" onClick={() => setOpenMarcaDrawer(false)}>Cancelar</Button>
                        <Button appearance="primary" onClick={guardarMarca}>
                            {editMode ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </div>
                </DrawerBody>
            </Drawer>

            {/* Drawer Modelo */}
            <Drawer position="end" open={openModeloDrawer} onOpenChange={(_, data) => setOpenModeloDrawer(data.open)}>
                <DrawerHeader className="border-b bg-gradient-to-r from-green-50 to-white">
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={() => setOpenModeloDrawer(false)} />}>
                        <span className="text-lg font-bold text-slate-800">
                            {editMode ? '✏️ Editar Modelo' : '📝 Nuevo Modelo'}
                        </span>
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody className="p-6 space-y-4">
                    <Field label="Marca" required>
                        <Input value={selectedMarca?.nombre || ''} disabled />
                    </Field>
                    <Field label="Nombre del Modelo" required>
                        <Input
                            value={modeloForm.nombre}
                            onChange={(e) => setModeloForm({ ...modeloForm, nombre: e.target.value })}
                            placeholder="Ej. CF283A, TN3479, 006R01731"
                        />
                    </Field>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button appearance="secondary" onClick={() => setOpenModeloDrawer(false)}>Cancelar</Button>
                        <Button appearance="primary" onClick={guardarModelo}>
                            {editMode ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </div>
                </DrawerBody>
            </Drawer>
        </div>
    )
}

export default Configuracion
