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
    Toaster,
    Badge,
    Spinner,
    Select,
    TabList,
    Tab,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem
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
import CompraTonersDrawer from '../components/toners/CompraTonersDrawer'
import EquiposPorOC from '../components/equipos/EquiposPorOC'
import DetalleOCEquiposDrawer from '../components/equipos/DetalleOCEquiposDrawer'
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
        tonerCountsByDetalle, categorias,
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
        diagnostico, diagnosticar,
        intentarAutoDetectarMonitor,
        monitoresDetectados, monitorSeleccionadoIndex, seleccionarMonitor,
        resetForm,
        exportando, exportarAExcel,
        mostrarToast,
        handleSerieBlur, serieError
    } = useBienes()

    const [selectedIds, setSelectedIds] = useState(new Set())
    const [batchCondicion, setBatchCondicion] = useState('')
    const [batchUpdating, setBatchUpdating] = useState(false)

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
        setBatchUpdating(true)
        try {
            const { error } = await supabase
                .from('bienes')
                .update({ condicion: batchCondicion })
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
            <Toaster />

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
                <TonersPorOC
                    compras={comprasAgrupadas}
                    tonerCountsByDetalle={tonerCountsByDetalle}
                    onCompraClick={handleCompraClick}
                    onAgregarMas={handleAddMoreToCompra}
                />
            ) : activeTab === 'equipos' ? (
                <EquiposPorOC
                    compras={comprasEquipos}
                    bienesSinOC={bienesSinOC}
                    onCompraClick={handleCompraEquipoClick}
                    onAgregarMas={handleAddMoreToCompraEquipo}
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
                onAgregarMas={handleAddMoreToCompra}
                onBatchUpdate={handleBatchUpdate}
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
                onAgregarMas={handleAddMoreToCompraEquipo}
                onBatchUpdate={handleBatchUpdateEquipo}
            />

            <ImportarBienesExcelDrawer
                open={openImportarExcelDrawer}
                onClose={() => setOpenImportarExcelDrawer(false)}
                onImport={handleImportarExcelBienes}
            />

            <ConfirmDialog
                title="Eliminar bien"
                open={!!deleteTarget}
                message="¿Estás seguro? Esta acción no se puede deshacer."
                onConfirm={confirmDelete}
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
        </div>
    )
}

export default Bienes
