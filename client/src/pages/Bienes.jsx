import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
    AddRegular,
    SearchRegular,
    ArrowSyncRegular,
    LaptopRegular,
    PrintRegular,
    KeyboardRegular,
    CartRegular,
    DesktopRegular,
    DocumentRegular,
    WindowDevToolsFilled,
    MoreHorizontalRegular
} from '@fluentui/react-icons'
import {
    Button,
    Input,
    Card,
    Badge,
    Spinner,
    Select,
    TabList,
    Tab,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@fluentui/react-components'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import useBienes from '../hooks/useBienes'
import DrawerBien from '../components/bienes/DrawerBien'
import BienesTable from '../components/bienes/BienesTable'
import BatchActionBar from '../components/bienes/BatchActionBar'
import PaginationBar from '../components/bienes/PaginationBar'
import WorkstationGridView from '../components/bienes/WorkstationGridView'
import TonersPorOC from '../components/toners/TonersPorOC'
import DetalleOCDrawer from '../components/toners/DetalleOCDrawer'
import DrawerDetalleToner from '../components/toners/DrawerDetalleToner'
import CompraTonersDrawer from '../components/toners/CompraTonersDrawer'
import EquiposPorOC from '../components/equipos/EquiposPorOC'
import DetalleOCEquiposDrawer from '../components/equipos/DetalleOCEquiposDrawer'
import DrawerDetalleEquipo from '../components/equipos/DrawerDetalleEquipo'
import DrawerDetalleBien from '../components/bienes/DrawerDetalleBien'
import CompraEquiposDrawer from '../components/equipos/CompraEquiposDrawer'
import ImportarBienesExcelDrawer from '../components/equipos/ImportarBienesExcelDrawer'

const Bienes = () => {
    const location = useLocation()

    const {
        bienes, loading, searchTerm, setSearchTerm,
        openDrawer, setOpenDrawer,
        editMode,
        activeTab, setActiveTab,
        marcas, modelos, modelosFiltrados,
        comprasAgrupadas, openDetalleDrawer, setOpenDetalleDrawer,
        openCompraDrawer, setOpenCompraDrawer,
        selectedCompra, setSelectedCompra,
        selectedCompraToners, setSelectedCompraToners,
        prefillCompraId, setPrefillCompraId,
        ambientes,
        formData,
        tonerCountsByDetalle, tonersSinOC, categorias,
        filteredBienes, paginatedData, stats, filtroOC, setFiltroOC,
        currentPage, setCurrentPage, totalPages, PAGE_SIZE,
        cargarBienes,
        cargarCompras, cargarComprasEquipos, cargarBienesSinOC,
        handleAddMoreToCompra, handleCompraClick, handleBatchUpdate,
        handleRegistrarCompra,
        comprasEquipos,
        openDetalleEquipoDrawer, setOpenDetalleEquipoDrawer,
        openCompraEquipoDrawer, setOpenCompraEquipoDrawer,
        selectedCompraEquipo,
        selectedCompraEquipos,
        prefillCompraEquipoId, setPrefillCompraEquipoId,
        openImportarExcelDrawer, setOpenImportarExcelDrawer,
        bienesSinOC,
        handleCompraEquipoClick, handleAddMoreToCompraEquipo, handleBatchUpdateEquipo,
        handleRegistrarCompraEquipo,
        handleImportarExcelBienes,
        handleInputChange, handleSubmit, handleEdit, handleDelete, confirmDelete,
        deleteTarget, setDeleteTarget,
        handleEliminarOC, confirmEliminarOC,
        deleteOCTarget, setDeleteOCTarget,
        ocBloqueoInfo, setOcBloqueoInfo,
        diagnostico, diagnosticar,
        intentarAutoDetectarMonitor,
        monitoresDetectados, monitorSeleccionadoIndex, seleccionarMonitor,
        resetForm,
        exportando, exportarAExcel,
        mostrarToast,
        handleSerieBlur, serieError
    } = useBienes()

    const handleConfirmDelete = async () => {
        await confirmDelete()
        setOpenDetalleDrawer(false)
        setOpenDetalleEquipoDrawer(false)
        setOpenTonerDetalleDrawer(false)
        setOpenEquipoDetalleDrawer(false)
        setOpenBienDetalleDrawer(false)
    }

    const [selectedIds, setSelectedIds] = useState(new Set())
    const [batchCondicion, setBatchCondicion] = useState('')
    const [batchUpdating, setBatchUpdating] = useState(false)
    const [selectedTonerDetail, setSelectedTonerDetail] = useState(null)
    const [openTonerDetalleDrawer, setOpenTonerDetalleDrawer] = useState(false)
    const [selectedEquipoDetail, setSelectedEquipoDetail] = useState(null)
    const [openEquipoDetalleDrawer, setOpenEquipoDetalleDrawer] = useState(false)
    const [selectedBienDetail, setSelectedBienDetail] = useState(null)
    const [openBienDetalleDrawer, setOpenBienDetalleDrawer] = useState(false)

    useEffect(() => {
        setSelectedIds(new Set())
    }, [searchTerm, activeTab, filtroOC])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const q = params.get('search')
        if (q) {
            setSearchTerm(q)
        }
    }, [location.search])

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredBienes.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredBienes.map(b => b.id)))
        }
    }

    const handleBatchCondicion = async () => {
        if (!batchCondicion || selectedIds.size === 0) return

        if (batchCondicion === 'Chatarra' || batchCondicion === 'Malo') {
            const idsImpresora = [...selectedIds].filter(id => {
                const bien = filteredBienes.find(b => b.id === id)
                return bien && ['Impresora', 'Multifuncional'].includes(bien.tipo_equipo)
            })

            if (idsImpresora.length > 0) {
                const { data: tonersActivos, error: tonerError } = await supabase
                    .from('asignacion_toners')
                    .select('impresora_id, toner_id')
                    .in('impresora_id', idsImpresora)
                    .eq('estado', 'Activo')

                if (tonerError) throw tonerError

                if (tonersActivos && tonersActivos.length > 0) {
                    const impresorasBloqueadas = tonersActivos.map(t => {
                        const bien = filteredBienes.find(b => b.id === t.impresora_id)
                        return bien ? `${b.marca} ${b.modelo} (${b.serie || 'sin serie'})` : t.impresora_id
                    })
                    mostrarToast(
                        `⚠️ No se puede cambiar condición. ${tonersActivos.length} impresora(s) tienen tóner activo: ${impresorasBloqueadas.join(', ')}`,
                        'error'
                    )
                    setBatchUpdating(false)
                    return
                }
            }
        }

        setBatchUpdating(true)
        try {
            const batchUpdate = { condicion: batchCondicion }
            if (batchCondicion === 'Chatarra') {
                batchUpdate.estado = 'Dado de Baja'
            } else if (batchCondicion === 'Malo') {
                batchUpdate.estado = 'Inactivo'
            }
            const { error } = await supabase
                .from('bienes')
                .update(batchUpdate)
                .in('id', [...selectedIds])
            if (error) throw error
            await cargarBienes(activeTab)
            setSelectedIds(new Set())
            setBatchCondicion('')
            mostrarToast(`${selectedIds.size} bienes actualizados a "${batchCondicion}"`, 'success')
        } catch (error) {
            mostrarToast(error.message || 'Error al actualizar condiciones', 'error')
        } finally {
            setBatchUpdating(false)
        }
    }

    const onCloseDrawer = () => {
        setOpenDrawer(false)
        resetForm()
    }

    const handleEditFromDetail = (toner) => {
        setOpenTonerDetalleDrawer(false)
        setSelectedTonerDetail(null)
        handleEdit(toner)
    }

    const handleEquipoDetailClick = (equipo) => {
        setSelectedEquipoDetail(equipo)
        setOpenEquipoDetalleDrawer(true)
    }

    const handleEditFromEquipoDetail = (equipo) => {
        setOpenEquipoDetalleDrawer(false)
        setSelectedEquipoDetail(null)
        handleEdit(equipo)
    }

    const handleBienDetailClick = (bien) => {
        setSelectedBienDetail(bien)
        setOpenBienDetalleDrawer(true)
    }

    const handleEditFromBienDetail = (bien) => {
        setOpenBienDetalleDrawer(false)
        setSelectedBienDetail(null)
        handleEdit(bien)
    }

    const tabsConfig = [
        { id: 'estaciones', label: 'Equipos de Cómputo', icon: DesktopRegular },
        { id: 'computo', label: 'CPU y Laptops', icon: LaptopRegular, badge: stats.computo },
        { id: 'impresoras', label: 'Impresoras y Proyectores', icon: PrintRegular, badge: stats.impresoras },
        { id: 'perifericos', label: 'Periféricos', icon: KeyboardRegular, badge: stats.perifericos },
        { id: 'consumibles', label: 'Consumibles (Tóner)', icon: CartRegular, badge: stats.consumibles },
        { id: 'equipos', label: 'Equipos por OC', icon: DesktopRegular },
        { id: 'otros', label: 'Otros Equipos', icon: WindowDevToolsFilled },
    ]

    return (
        <div className="p-1 space-y-6">
            {/* Header Principal */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Gestión de Bienes
                        <span className="text-base font-semibold text-gray-400 ml-2">· Total: {stats.total}</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Administración del inventario tecnológico</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Button
                        appearance="primary"
                        icon={<AddRegular />}
                        onClick={() => {
                            resetForm()
                            setOpenDrawer(true)
                        }}
                    >
                        Nuevo Bien
                    </Button>
                    <Menu>
                        <MenuTrigger>
                            <Button icon={<MoreHorizontalRegular />} appearance="secondary">Acciones</Button>
                        </MenuTrigger>
                        <MenuPopover>
                            <MenuList>
                                <MenuItem icon={<ArrowSyncRegular />} onClick={exportarAExcel} disabled={exportando}>
                                    Exportar Excel{exportando ? '...' : ''}
                                </MenuItem>
                                <MenuItem icon={<DocumentRegular />} onClick={() => setOpenImportarExcelDrawer(true)}>
                                    Importar Excel
                                </MenuItem>
                                <MenuItem divider />
                                <MenuItem icon={<CartRegular />} onClick={() => setOpenCompraDrawer(true)}>
                                    Registrar Compra Tóneres
                                </MenuItem>
                                <MenuItem icon={<DesktopRegular />} onClick={() => setOpenCompraEquipoDrawer(true)}>
                                    Registrar Compra Equipos
                                </MenuItem>
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                </div>
            </div>

            {/* TABS DE NAVEGACIÓN */}
            <TabList selectedValue={activeTab} onTabSelect={(_, d) => setActiveTab(d.value)}>
                {tabsConfig.map(({ id, label, icon: Icon, badge }) => (
                    <Tab key={id} value={id} icon={<Icon />}>
                        {label}
                        {badge !== undefined && <Badge appearance="filled" size="small">{badge}</Badge>}
                    </Tab>
                ))}
            </TabList>

            {/* Barra de Búsqueda */}
            <Card className="!p-3">
                <div className="flex gap-3 items-center">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por tipo, marca, modelo, código patrimonial, serie o código TI..."
                            contentBefore={<SearchRegular />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button
                        icon={<ArrowSyncRegular />}
                        onClick={() => {
                            if (activeTab === 'consumibles') {
                                cargarCompras(searchTerm)
                            } else if (activeTab === 'equipos') {
                                cargarComprasEquipos(searchTerm)
                                cargarBienesSinOC()
                            } else {
                                cargarBienes(activeTab)
                            }
                        }}
                        appearance="subtle"
                        size="small"
                    >
                        Sincronizar
                    </Button>
                </div>
                {activeTab !== 'consumibles' && activeTab !== 'equipos' && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">OC:</span>
                        <Select value={filtroOC} onChange={(e) => setFiltroOC(e.target.value)} size="small">
                            <option value="todos">Todos</option>
                            <option value="conOC">Con O/C</option>
                            <option value="sinOC">Sin O/C</option>
                        </Select>
                    </div>
                )}
            </Card>

            {/* VISTA POR TAB */}
            {activeTab === 'consumibles' ? (
                <>
                    <TonersPorOC
                        compras={comprasAgrupadas}
                        tonerCountsByDetalle={tonerCountsByDetalle}
                        onCompraClick={handleCompraClick}
                        onAgregarMas={handleAddMoreToCompra}
                        onEliminarOC={(compra) => handleEliminarOC(compra, 'toners')}
                    />
                    {tonersSinOC.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-semibold text-gray-700">Toners sin orden de compra</span>
                                <Badge appearance="filled" color="brand" size="small">{tonersSinOC.length}</Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {tonersSinOC.map(t => {
                                    const estadoLabel = t.estado === 'Activo' || t.estado === 'Disponible' ? 'Disponible' : t.estado
                                    const estadoColor = t.estado === 'Activo' || t.estado === 'Disponible' ? 'success'
                                        : t.estado === 'Asignado' ? 'brand'
                                        : 'danger'
                                    return (
                                        <Card key={t.id} appearance="outline" className="border-gray-200 !shadow-sm hover:!shadow-md transition-shadow cursor-pointer" onClick={() => {
                                            setSelectedTonerDetail(t)
                                            setOpenTonerDetalleDrawer(true)
                                        }}>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm text-gray-800 truncate">
                                                        {t.color_toner || '—'}
                                                    </span>
                                                    <Badge appearance="filled" color={estadoColor} size="extra-small">
                                                        {estadoLabel}
                                                    </Badge>
                                                </div>
                                                {t.marca || t.modelo ? (
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {[t.marca, t.modelo].filter(Boolean).join(' ')}
                                                    </p>
                                                ) : null}
                                                {t.serie && (
                                                    <p className="text-xs text-gray-400 truncate">
                                                        Serie: {t.serie}
                                                    </p>
                                                )}
                                                {t.lote && (
                                                    <p className="text-xs text-gray-400 truncate">
                                                        Lote: {t.lote}
                                                    </p>
                                                )}
                                                {t.ubicacion_almacen && (
                                                    <p className="text-xs text-gray-400 truncate">
                                                        Ubicación: {t.ubicacion_almacen}
                                                    </p>
                                                )}
                                                {t.fecha_vencimiento && (
                                                    <p className={`text-xs ${new Date(t.fecha_vencimiento) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                                                        Vence: {t.fecha_vencimiento}
                                                    </p>
                                                )}
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            ) : activeTab === 'equipos' ? (
                <EquiposPorOC
                    compras={comprasEquipos}
                    bienesSinOC={bienesSinOC}
                    onCompraClick={handleCompraEquipoClick}
                    onAgregarMas={handleAddMoreToCompraEquipo}
                    onEliminarOC={(compra) => handleEliminarOC(compra, 'equipos')}
                    onBienSinODetail={handleEquipoDetailClick}
                    onBienSinOClick={handleEdit}
                />
            ) : activeTab === 'estaciones' ? (
                <WorkstationGridView
                    bienes={filteredBienes}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                />
            ) : (
                <>
                {selectedIds.size > 0 && (
                    <BatchActionBar
                        selectedCount={selectedIds.size}
                        batchCondicion={batchCondicion}
                        setBatchCondicion={setBatchCondicion}
                        onApply={handleBatchCondicion}
                        onCancel={() => setSelectedIds(new Set())}
                        updating={batchUpdating}
                    />
                )}
                <Card className="overflow-hidden !p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-500">
                            <Spinner size="small" label="Cargando inventario..." labelPosition="after" />
                        </div>
                    ) : (
                        <BienesTable
                            filteredBienes={filteredBienes}
                            paginatedData={paginatedData}
                            selectedIds={selectedIds}
                            toggleSelect={toggleSelect}
                            toggleSelectAll={toggleSelectAll}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            onDetailClick={handleBienDetailClick}
                        />
                    )}
                </Card>
                <PaginationBar
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                    pageSize={PAGE_SIZE}
                    totalItems={filteredBienes.length}
                />
                </>)}

            <DrawerBien
                open={openDrawer}
                onClose={onCloseDrawer}
                editMode={editMode}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                marcas={marcas}
                modelosFiltrados={modelosFiltrados}
                diagnostico={diagnostico}
                diagnosticar={diagnosticar}
                intentarAutoDetectarMonitor={intentarAutoDetectarMonitor}
                monitoresDetectados={monitoresDetectados}
                monitorSeleccionadoIndex={monitorSeleccionadoIndex}
                seleccionarMonitor={seleccionarMonitor}
                ambientes={ambientes}
                resetForm={resetForm}
                handleSerieBlur={handleSerieBlur}
                serieError={serieError}
            />

            <CompraTonersDrawer
                open={openCompraDrawer}
                onClose={() => {
                    setOpenCompraDrawer(false)
                    setPrefillCompraId('')
                }}
                marcas={marcas}
                modelos={modelos}
                prefillCompraId={prefillCompraId}
                onSave={handleRegistrarCompra}
            />

            <DetalleOCDrawer
                open={openDetalleDrawer}
                onClose={() => setOpenDetalleDrawer(false)}
                compra={selectedCompra}
                toners={selectedCompraToners}
                onEditToner={handleEdit}
                onDeleteToner={handleDelete}
                onAgregarMas={handleAddMoreToCompra}
                onBatchUpdate={handleBatchUpdate}
                onEliminarOC={(compra) => handleEliminarOC(compra, 'toners')}
            />

            <CompraEquiposDrawer
                open={openCompraEquipoDrawer}
                onClose={() => {
                    setOpenCompraEquipoDrawer(false)
                    setPrefillCompraEquipoId('')
                }}
                marcas={marcas}
                modelos={modelos}
                prefillCompraId={prefillCompraEquipoId}
                onSave={handleRegistrarCompraEquipo}
            />

            <DetalleOCEquiposDrawer
                open={openDetalleEquipoDrawer}
                onClose={() => setOpenDetalleEquipoDrawer(false)}
                compra={selectedCompraEquipo}
                equipos={selectedCompraEquipos}
                onEditEquipo={handleEdit}
                onDeleteEquipo={handleDelete}
                onAgregarMas={handleAddMoreToCompraEquipo}
                onBatchUpdate={handleBatchUpdateEquipo}
                onEliminarOC={(compra) => handleEliminarOC(compra, 'equipos')}
            />

            <ImportarBienesExcelDrawer
                open={openImportarExcelDrawer}
                onClose={() => setOpenImportarExcelDrawer(false)}
                onImport={handleImportarExcelBienes}
            />

            <DrawerDetalleToner
                open={openTonerDetalleDrawer}
                onClose={() => {
                    setOpenTonerDetalleDrawer(false)
                    setSelectedTonerDetail(null)
                }}
                toner={selectedTonerDetail}
                onEdit={handleEditFromDetail}
                onDelete={handleDelete}
            />

            <DrawerDetalleEquipo
                open={openEquipoDetalleDrawer}
                onClose={() => {
                    setOpenEquipoDetalleDrawer(false)
                    setSelectedEquipoDetail(null)
                }}
                equipo={selectedEquipoDetail}
                onEdit={handleEditFromEquipoDetail}
                onDelete={handleDelete}
            />

            <DrawerDetalleBien
                open={openBienDetalleDrawer}
                onClose={() => {
                    setOpenBienDetalleDrawer(false)
                    setSelectedBienDetail(null)
                }}
                bien={selectedBienDetail}
                onEdit={handleEditFromBienDetail}
                onDelete={handleDelete}
            />

            <ConfirmDialog
                title="Eliminar bien"
                open={!!deleteTarget}
                message="¿Estás seguro? Esta acción no se puede deshacer."
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            >
                {deleteTarget && (
                    <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-sm space-y-1">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            <span className="text-gray-500">Tipo:</span>
                            <span className="font-medium">{deleteTarget.tipo_equipo}</span>
                            {deleteTarget.marca && <><span className="text-gray-500">Marca:</span><span className="font-medium">{deleteTarget.marca}</span></>}
                            {deleteTarget.modelo && <><span className="text-gray-500">Modelo:</span><span className="font-medium">{deleteTarget.modelo}</span></>}
                            {deleteTarget.serie && <><span className="text-gray-500">Serie:</span><span className="font-medium">{deleteTarget.serie}</span></>}
                            {deleteTarget.codigo_patrimonial && <><span className="text-gray-500">Cód. Pat.:</span><span className="font-medium">{deleteTarget.codigo_patrimonial}</span></>}
                            {deleteTarget.codigo_ti && <><span className="text-gray-500">Cód. TI:</span><span className="font-medium">{deleteTarget.codigo_ti}</span></>}
                            <span className="text-gray-500">Estado:</span>
                            <span className="font-medium">{deleteTarget.estado}</span>
                        </div>
                    </div>
                )}
            </ConfirmDialog>

            <ConfirmDialog
                title="Eliminar orden de compra"
                open={!!deleteOCTarget}
                message="¿Estás seguro? Esta acción eliminará la O/C y sus detalles. Los bienes asociados se conservarán sin vínculo a la O/C."
                onConfirm={confirmEliminarOC}
                onCancel={() => setDeleteOCTarget(null)}
            >
                {deleteOCTarget && (
                    <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-sm space-y-1">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            <span className="text-gray-500">O/C:</span>
                            <span className="font-medium">{deleteOCTarget.compra.orden_compra}</span>
                            <span className="text-gray-500">Tipo:</span>
                            <span className="font-medium capitalize">{deleteOCTarget.tipo}</span>
                            {deleteOCTarget.compra.proveedor && <><span className="text-gray-500">Proveedor:</span><span className="font-medium">{deleteOCTarget.compra.proveedor}</span></>}
                        </div>
                    </div>
                )}
            </ConfirmDialog>

            <Dialog open={!!ocBloqueoInfo} onOpenChange={(_, d) => { if (!d.open) setOcBloqueoInfo(null) }}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>
                            <div className="flex items-center gap-2 text-red-600">
                                <span className="text-xl">⚠️</span>
                                <span>No se puede eliminar la O/C</span>
                            </div>
                        </DialogTitle>
                        <DialogContent>
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">
                                    Los siguientes bienes tienen asignaciones activas:
                                </p>
                                {ocBloqueoInfo && ocBloqueoInfo.items.length > 0 && (
                                    <div className="space-y-1 max-h-64 overflow-y-auto">
                                        {ocBloqueoInfo.items.map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs bg-red-50 border border-red-100 rounded px-3 py-2">
                                                <span className="font-medium text-gray-700 min-w-[120px] truncate">{item.tipo}</span>
                                                <span className="text-gray-500 truncate">{item.descripcion}</span>
                                                <span className="ml-auto">
                                                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                                                        {item.estado}
                                                    </span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-3">
                                    Para eliminar la O/C, primero debes finalizar las asignaciones activas.
                                </p>
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                                <Button appearance="primary">Entendido</Button>
                            </DialogTrigger>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </div>
    )
}

export default Bienes
