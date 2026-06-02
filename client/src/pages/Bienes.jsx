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
    WindowDevToolsFilled,
    DesktopKeyboardRegular,
    TvRegular,
    PhoneTabletRegular,
    ProjectionScreenRegular
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
    Toast,
    ToastTitle,
    ToastBody,
    Toaster,
    Badge,
    Tooltip
} from '@fluentui/react-components'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import useBienes from '../hooks/useBienes'
import DrawerBien from '../components/bienes/DrawerBien'
import TonersPorOC from '../components/toners/TonersPorOC'
import DetalleOCDrawer from '../components/toners/DetalleOCDrawer'
import CompraTonersDrawer from '../components/toners/CompraTonersDrawer'

const Bienes = () => {
    const {
        bienes, loading, searchTerm, setSearchTerm,
        openDrawer, setOpenDrawer,
        editMode,
        activeTab, setActiveTab,
        marcas, modelos, modelosFiltrados, marcaManual, setMarcaManual,
        comprasAgrupadas, openDetalleDrawer, setOpenDetalleDrawer,
        openCompraDrawer, setOpenCompraDrawer,
        selectedCompra, setSelectedCompra,
        selectedCompraToners, setSelectedCompraToners,
        prefillCompraId, setPrefillCompraId,
        ambientes,
        formData,
        tonerCountsByDetalle, categorias,
        stockPorModelo, filteredBienes, stats,
        cargarBienes,
        handleAddMoreToCompra, handleCompraClick, handleBatchUpdate,
        handleRegistrarCompra,
        handleInputChange, handleSubmit, handleEdit, handleDelete, confirmDelete,
        deleteTarget, setDeleteTarget,
        resetForm
    } = useBienes()

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
                        icon={<CartRegular />}
                        onClick={() => setOpenCompraDrawer(true)}
                    >
                        Registrar Compra Tóneres
                    </Button>
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
                <nav className="flex gap-1 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('computo')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'computo'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <LaptopRegular />
                        <span>🖥️ Equipos de Cómputo</span>
                        <Badge appearance="filled" size="small" className="ml-1">{stats.computo}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('impresoras')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'impresoras'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <PrintRegular />
                        <span>🖨️ Impresoras y Proyectores</span>
                        <Badge appearance="filled" size="small" className="ml-1">{stats.impresoras}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('perifericos')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'perifericos'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <KeyboardRegular />
                        <span>⌨️ Periféricos</span>
                        <Badge appearance="filled" size="small" className="ml-1">{stats.perifericos}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('consumibles')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'consumibles'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <CartRegular />
                        <span>🧴 Consumibles (Tóner)</span>
                        <Badge appearance="filled" size="small" className="ml-1">{stats.consumibles}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('otros')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'otros'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <WindowDevToolsFilled />
                        <span>🔧 Otros Equipos</span>
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
                        onClick={() => cargarBienes(activeTab)}
                        appearance="subtle"
                        size="small"
                    >
                        Sincronizar
                    </Button>
                </div>
            </Card>

            {/* VISTA POR TAB */}
            {activeTab === 'consumibles' ? (
                <TonersPorOC
                    compras={comprasAgrupadas}
                    tonerCountsByDetalle={tonerCountsByDetalle}
                    onCompraClick={handleCompraClick}
                    onAgregarMas={handleAddMoreToCompra}
                />
            ) : (
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
                                        <TableHeaderCell><span className="font-semibold">Tipo</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Marca / Modelo</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Código Patrimonial</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Serie</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Condición</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Estado</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Acciones</span></TableHeaderCell>
                                        <TableHeaderCell><span className="font-semibold">Stock</span></TableHeaderCell>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {filteredBienes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                                No se encontraron bienes registrados en esta categoría.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredBienes.map((bien) => (
                                            <TableRow key={bien.id} className="hover:bg-gray-50 transition-colors">
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
                                                <TableCell>
                                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
                                                        {bien.codigo_patrimonial || 'SIN CÓDIGO'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{bien.serie || '-'}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bien.condicion === 'Bueno' ? 'bg-green-100 text-green-800' :
                                                        bien.condicion === 'Regular' ? 'bg-amber-100 text-amber-800' :
                                                            bien.condicion === 'Chatarra' ? 'bg-gray-200 text-gray-700' :
                                                                'bg-rose-100 text-rose-800'
                                                        }`}>
                                                        {bien.condicion}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bien.estado === 'Activo' || bien.estado === 'Disponible' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'
                                                        }`}>
                                                        {bien.estado}
                                                    </span>
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
                                                <TableCell>
                                                    {bien.tipo_equipo === 'Tóner' ? (
                                                        <Badge appearance="filled" color="brand" size="small">
                                                            Stock: {stockPorModelo[`${bien.marca}-${bien.modelo}`] || 1}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>
            )}

            <DrawerBien
                open={openDrawer}
                onClose={onCloseDrawer}
                editMode={editMode}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                marcas={marcas}
                modelos={modelos}
                modelosFiltrados={modelosFiltrados}
                marcaManual={marcaManual}
                setMarcaManual={setMarcaManual}
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
