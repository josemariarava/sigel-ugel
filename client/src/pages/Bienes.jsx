import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
    AddRegular,
    EditRegular,
    DeleteRegular,
    SearchRegular,
    ArrowSyncRegular,
    LaptopRegular,
    PrintRegular,
    KeyboardRegular,
    CartRegular,
    DesktopRegular,
    DocumentRegular,
    WindowDevToolsFilled,
    DesktopKeyboardRegular,
    TvRegular,
    PhoneTabletRegular,
    ProjectionScreenRegular,
    CheckboxCheckedRegular,
    CheckboxUncheckedRegular
} from '@fluentui/react-icons'
import {
    Button,
    Input,
    Card,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Toaster,
    Badge,
    Tooltip,
    Select
} from '@fluentui/react-components'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import useBienes from '../hooks/useBienes'
import DrawerBien from '../components/bienes/DrawerBien'
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
        mostrarToast
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

    return (
        <div className="p-1 space-y-6">
            <Toaster />

            {/* Header Principal con estadísticas */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Bienes</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Administración del inventario tecnológico</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        appearance="secondary"
                        icon={<ArrowSyncRegular />}
                        onClick={exportarAExcel}
                        disabled={exportando}
                    >
                        <span className="hidden sm:inline">{exportando ? 'Exportando...' : 'Exportar Excel'}</span>
                    </Button>
                    <Button
                        appearance="secondary"
                        icon={<CartRegular />}
                        onClick={() => setOpenCompraDrawer(true)}
                    >
                        <span className="hidden sm:inline">Registrar Compra Tóneres</span>
                    </Button>
                    <Button
                        appearance="secondary"
                        icon={<DesktopRegular />}
                        onClick={() => setOpenCompraEquipoDrawer(true)}
                    >
                        <span className="hidden sm:inline">Registrar Compra Equipos</span>
                    </Button>
                    <Button
                        appearance="secondary"
                        icon={<DocumentRegular />}
                        onClick={() => setOpenImportarExcelDrawer(true)}
                    >
                        <span className="hidden sm:inline">Importar Excel</span>
                    </Button>
                    <Button
                        appearance="primary"
                        icon={<AddRegular />}
                        onClick={() => {
                            resetForm()
                            setOpenDrawer(true)
                        }}
                    >
                        <span className="hidden sm:inline">Nuevo Bien</span>
                    </Button>
                </div>
            </div>

            {/* Tarjetas de estadísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Total Bienes</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Equipos Cómputo</p>
                    <p className="text-2xl font-bold">{stats.computo}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Impresoras</p>
                    <p className="text-2xl font-bold">{stats.impresoras}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Periféricos</p>
                    <p className="text-2xl font-bold">{stats.perifericos}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Consumibles</p>
                    <p className="text-2xl font-bold">{stats.consumibles}</p>
                </div>
            </div>

            {/* TABS DE NAVEGACIÓN */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-1 overflow-x-auto" role="tablist">
                    <button role="tab"
                        onClick={() => setActiveTab('computo')}
                        aria-selected={activeTab === 'computo'}
                        className={`px-3 sm:px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'computo'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <LaptopRegular />
                        <span className="hidden sm:inline">Equipos de Cómputo</span>
                        <Badge appearance="filled" size="small">{stats.computo}</Badge>
                    </button>
                    <button role="tab"
                        onClick={() => setActiveTab('impresoras')}
                        aria-selected={activeTab === 'impresoras'}
                        className={`px-3 sm:px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'impresoras'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <PrintRegular />
                        <span className="hidden sm:inline">Impresoras y Proyectores</span>
                        <Badge appearance="filled" size="small">{stats.impresoras}</Badge>
                    </button>
                    <button role="tab"
                        onClick={() => setActiveTab('perifericos')}
                        aria-selected={activeTab === 'perifericos'}
                        className={`px-3 sm:px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'perifericos'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <KeyboardRegular />
                        <span className="hidden sm:inline">Periféricos</span>
                        <Badge appearance="filled" size="small">{stats.perifericos}</Badge>
                    </button>
                    <button role="tab"
                        onClick={() => setActiveTab('consumibles')}
                        aria-selected={activeTab === 'consumibles'}
                        className={`px-3 sm:px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'consumibles'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <CartRegular />
                        <span className="hidden sm:inline">Consumibles (Tóner)</span>
                        <Badge appearance="filled" size="small">{stats.consumibles}</Badge>
                    </button>
                    <button role="tab"
                        onClick={() => setActiveTab('equipos')}
                        aria-selected={activeTab === 'equipos'}
                        className={`px-3 sm:px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'equipos'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <DesktopRegular />
                        <span className="hidden sm:inline">Equipos por OC</span>
                    </button>
                    <button role="tab"
                        onClick={() => setActiveTab('otros')}
                        aria-selected={activeTab === 'otros'}
                        className={`px-3 sm:px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'otros'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <WindowDevToolsFilled />
                        <span className="hidden sm:inline">Otros Equipos</span>
                    </button>
                </nav>
            </div>

            {/* Barra de Búsqueda */}
            <Card className="!p-3">
                <div className="flex gap-3 items-center">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por tipo, marca, modelo, código patrimonial o serie..."
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
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500 font-medium">O/C:</span>
                        <div className="flex gap-1">
                            {['todos', 'conOC', 'sinOC'].map(op => (
                                <button
                                    key={op}
                                    onClick={() => setFiltroOC(op)}
                                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                                        filtroOC === op
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    {op === 'todos' ? 'Todos' : op === 'conOC' ? 'Con O/C' : 'Sin O/C'}
                                </button>
                            ))}
                        </div>
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
            ) : (
                <>
                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                        <span className="text-sm font-medium text-blue-800">
                            {selectedIds.size} seleccionado(s)
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                            <Select
                                value={batchCondicion}
                                onChange={(e) => setBatchCondicion(e.target.value)}
                                placeholder="Nueva condición"
                                className="text-sm"
                            >
                                <option value="">Cambiar condición a...</option>
                                <option value="Bueno">✅ Bueno</option>
                                <option value="Regular">⚠️ Regular</option>
                                <option value="Malo">❌ Malo</option>
                                <option value="Chatarra">🗑️ Chatarra</option>
                            </Select>
                            <Button
                                appearance="primary"
                                size="small"
                                onClick={handleBatchCondicion}
                                disabled={!batchCondicion || batchUpdating}
                            >
                                {batchUpdating ? 'Actualizando...' : 'Aplicar'}
                            </Button>
                            <Button
                                appearance="subtle"
                                size="small"
                                onClick={() => setSelectedIds(new Set())}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
                <Card className="overflow-hidden !p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-500">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Cargando inventario...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHeaderCell className="w-8">
                                            <button onClick={toggleSelectAll} className="cursor-pointer">
                                                {selectedIds.size === filteredBienes.length && filteredBienes.length > 0
                                                    ? <CheckboxCheckedRegular className="text-blue-600" />
                                                    : <CheckboxUncheckedRegular className="text-gray-400" />
                                                }
                                            </button>
                                        </TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Tipo</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Marca / Modelo</span></TableHeaderCell>
                                        <TableHeaderCell className="hidden sm:table-cell"><span className="font-semibold">Código Patrimonial</span></TableHeaderCell>
                                        <TableHeaderCell className="hidden sm:table-cell"><span className="font-semibold">Serie</span></TableHeaderCell>
                                        <TableHeaderCell className="hidden md:table-cell"><span className="font-semibold">Condición</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Estado</span></TableHeaderCell>
                                        <TableHeaderCell className="hidden sm:table-cell"><span className="font-semibold">O/C</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Acciones</span></TableHeaderCell>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {filteredBienes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                                                No se encontraron bienes registrados en esta categoría.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((bien) => (
                                            <TableRow key={bien.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(bien.id) ? 'bg-blue-50' : ''}`}>
                                                <TableCell className="w-8">
                                                    <button onClick={() => toggleSelect(bien.id)} className="cursor-pointer">
                                                        {selectedIds.has(bien.id)
                                                            ? <CheckboxCheckedRegular className="text-blue-600" />
                                                            : <CheckboxUncheckedRegular className="text-gray-400" />
                                                        }
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {bien.tipo_equipo === 'Laptop' && <LaptopRegular className="text-blue-500" />}
                                                        {bien.tipo_equipo === 'Impresora' && <PrintRegular className="text-purple-500" />}
                                                        {bien.tipo_equipo === 'Monitor' && <TvRegular className="text-green-500" />}
                                                        {bien.tipo_equipo === 'Tablet' && <PhoneTabletRegular className="text-black" />}
                                                        {bien.tipo_equipo === 'Desktop' && <DesktopKeyboardRegular className="text-orange-500" />}
                                                        {bien.tipo_equipo === 'Proyector' && <ProjectionScreenRegular className="text-green-500" />}
                                                        <b>{bien.tipo_equipo}</b>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className='text-sm'>{bien.marca || '-'} {bien.modelo || ''}</span>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
                                                        {bien.codigo_patrimonial || 'SIN CÓDIGO'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell font-mono text-xs">{bien.serie || '-'}</TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bien.condicion === 'Bueno' ? 'bg-green-100 text-green-800' :
                                                        bien.condicion === 'Regular' ? 'bg-amber-100 text-amber-800' :
                                                            bien.condicion === 'Chatarra' ? 'bg-gray-200 text-gray-700' :
                                                                'bg-rose-100 text-rose-800'
                                                        }`}>
                                                        {bien.condicion}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bien.estado === 'Activo' || bien.estado === 'Disponible' ? 'bg-blue-100 text-blue-800' : bien.estado === 'Inactivo' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {bien.estado}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    {bien.compra_equipo_detalle_id || bien.compra_detalle_id || (bien.orden_compra && bien.orden_compra.trim()) ? (
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                                            Con O/C
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                                                            Sin O/C
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Tooltip content="Editar bien" relationship="label">
                                                            <Button
                                                                appearance="subtle"
                                                                icon={<EditRegular />}
                                                                onClick={() => handleEdit(bien)}
                                                                size="small"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip content="Eliminar bien" relationship="label">
                                                            <Button
                                                                appearance="subtle"
                                                                icon={<DeleteRegular />}
                                                                onClick={() => handleDelete(bien)}
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
                        </div>
                    )}
                </Card>
                {!loading && filteredBienes.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
                        <span>
                            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–
                            {Math.min(currentPage * PAGE_SIZE, filteredBienes.length)} de {filteredBienes.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                size="small"
                                appearance="subtle"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                Anterior
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum
                                if (totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                } else {
                                    pageNum = currentPage - 2 + i
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        size="small"
                                        appearance={currentPage === pageNum ? 'primary' : 'subtle'}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                            <Button
                                size="small"
                                appearance="subtle"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
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
