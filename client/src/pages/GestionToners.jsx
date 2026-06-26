import {
    CartRegular,
    AddRegular,
    SearchRegular,
    ArrowSyncRegular,
    ArrowUndoRegular,
    PrintRegular,
    CheckmarkCircleRegular,
    HistoryRegular,
    EyeRegular,
    DocumentPdfRegular,
    EditRegular,
    DeleteRegular,
} from '@fluentui/react-icons'
import {
    Button,
    useToastController,
    Toaster,
    Input,
    Badge,
    Tooltip,
    Card
} from '@fluentui/react-components'

import { useGestionToners } from '../hooks/useGestionToners'
import DrawerAsignacionToners from '../components/gestionToners/DrawerAsignacionToners'
import ModalTerminar from '../components/gestionToners/ModalTerminar'
import ModalHistorialToners from '../components/gestionToners/ModalHistorialToners'
import ConfirmDialog from '../components/shared/ConfirmDialog'

const GestionToners = () => {
    const { dispatchToast } = useToastController()
    const h = useGestionToners(dispatchToast)

    return (
        <div className="p-1 space-y-6">
            <Toaster />

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CartRegular className="text-blue-600" />
                        Gestión de Tóneres y Consumibles
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Control de asignación, seguimiento y actas de entrega</p>
                </div>
                <Button
                    appearance="primary"
                    icon={<AddRegular />}
                    onClick={() => { h.resetForm(); h.openDrawerToners() }}
                >
                    Nueva Asignación
                </Button>
            </div>

            {/* ESTADÍSTICAS RÁPIDAS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Total Asignaciones</p>
                    <p className="text-2xl font-bold">{h.asignaciones.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Activos</p>
                    <p className="text-2xl font-bold">{h.asignaciones.filter(a => a.estado === 'Activo').length}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Terminados</p>
                    <p className="text-2xl font-bold">{h.asignaciones.filter(a => a.estado === 'Terminado').length}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Tóneres Stock</p>
                    <p className="text-2xl font-bold">{h.tonersDisponibles.length}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-3 text-white shadow-lg">
                    <p className="text-xs opacity-90">Impresoras</p>
                    <p className="text-2xl font-bold">{h.impresoras.length}</p>
                </div>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <Card className="!p-3">
                <div className="flex gap-3 items-center">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por marca, modelo, serie, responsable o impresora..."
                            contentBefore={<SearchRegular />}
                            value={h.searchTerm}
                            onChange={(e) => h.setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button icon={<ArrowSyncRegular />} onClick={h.cargarDatos} appearance="subtle">
                        Sincronizar
                    </Button>
                </div>
            </Card>

            {/* TABLA DE ASIGNACIONES */}
            <Card className="overflow-hidden !p-0">
                {h.loading ? (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Cargando asignaciones...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500 border-b">
                                <tr>
                                    <th className="px-4 py-3">Tóner</th>
                                    <th className="px-4 py-3">Serie / Código</th>
                                    <th className="px-4 py-3">Responsable</th>
                                    <th className="px-4 py-3">Impresora</th>
                                    <th className="px-4 py-3">Ubicación</th>
                                    <th className="px-4 py-3">Fecha Asig.</th>
                                    <th className="px-4 py-3">Duración</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[10px]">
                                {h.filteredAsignaciones.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-12 text-gray-500">
                                            No hay asignaciones de tóneres registradas
                                        </td>
                                    </tr>
                                ) : (
                                    h.paginatedData.map((asig) => (
                                        <tr key={asig.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <CartRegular className="text-amber-600" />
                                                    <div>
                                                        <span className="font-medium">{asig.toner?.marca} {asig.toner?.modelo}</span>
                                                        {asig.toner?.compra_detalle?.compra && (
                                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                                O/C: {asig.toner.compra_detalle.compra.orden_compra}
                                                                {asig.toner.compra_detalle.compra.proveedor && ` | ${asig.toner.compra_detalle.compra.proveedor}`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{asig.toner?.serie || '-'}</td>
                                            <td className="px-4 py-3">{asig.persona?.apellidos}, {asig.persona?.nombres}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <PrintRegular className="text-gray-400 text-sm" />
                                                    <span className="text-xs">{asig.impresora?.marca} {asig.impresora?.modelo}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{asig.ambiente?.nombre || '-'}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{asig.fecha_asignacion}</td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {h.calcularDuracion(asig)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${h.getEstadoColor(asig.estado)}`}>
                                                    {asig.estado || 'Activo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex gap-1 justify-center">
                                                    {asig.estado === 'Activo' && (
                                                        <Tooltip content="Marcar como terminado">
                                                            <Button
                                                                size="small"
                                                                appearance="subtle"
                                                                icon={<CheckmarkCircleRegular />}
                                                                className="text-green-600"
                                                                onClick={() => {
                                                                    h.setSelectedAsignacion(asig)
                                                                    h.setOpenTerminarModal(true)
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                    {asig.estado === 'Activo' && (
                                                        <Tooltip content="Devolver a stock">
                                                            <Button
                                                                size="small"
                                                                appearance="subtle"
                                                                icon={<ArrowUndoRegular />}
                                                                className="text-amber-600"
                                                                onClick={() => h.devolverToner(asig)}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip content="Ver Historial">
                                                        <Button
                                                            size="small"
                                                            appearance="subtle"
                                                            icon={<HistoryRegular />}
                                                            onClick={() => h.verHistorial(asig.toner_id)}
                                                        />
                                                    </Tooltip>
                                                    {asig.acta_url && (
                                                        <Tooltip content="Ver Acta">
                                                            <a href={asig.acta_url} target="_blank" rel="noopener noreferrer">
                                                                <Button size="small" appearance="subtle" icon={<EyeRegular />} className="text-blue-600" />
                                                            </a>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip content="Generar Acta">
                                                        <Button
                                                            size="small"
                                                            appearance="subtle"
                                                            icon={<DocumentPdfRegular />}
                                                            className="text-red-600"
                                                            onClick={() => h.generarActaManual(asig)}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip content="Editar">
                                                        <Button
                                                            size="small"
                                                            appearance="subtle"
                                                            icon={<EditRegular />}
                                                            onClick={() => h.handleEdit(asig)}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip content="Eliminar">
                                                        <Button
                                                            size="small"
                                                            appearance="subtle"
                                                            icon={<DeleteRegular />}
                                                            className="text-red-600"
                                                            onClick={() => h.handleDelete(asig)}
                                                        />
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {!h.loading && h.filteredAsignaciones.length > h.PAGE_SIZE && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
                        <span>
                            Mostrando {(h.currentPage - 1) * h.PAGE_SIZE + 1}–{Math.min(h.currentPage * h.PAGE_SIZE, h.filteredAsignaciones.length)} de {h.filteredAsignaciones.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button size="small" appearance="subtle" disabled={h.currentPage <= 1} onClick={() => h.setCurrentPage(h.currentPage - 1)}>
                                Anterior
                            </Button>
                            {Array.from({ length: Math.min(h.totalPages, 5) }, (_, i) => {
                                let pageNum
                                if (h.totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (h.currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (h.currentPage >= h.totalPages - 2) {
                                    pageNum = h.totalPages - 4 + i
                                } else {
                                    pageNum = h.currentPage - 2 + i
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        size="small"
                                        appearance={h.currentPage === pageNum ? 'primary' : 'subtle'}
                                        onClick={() => h.setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                            <Button size="small" appearance="subtle" disabled={h.currentPage >= h.totalPages} onClick={() => h.setCurrentPage(h.currentPage + 1)}>
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* DRAWERS Y MODALES */}
            <DrawerAsignacionToners
                openDrawer={h.openDrawer} setOpenDrawer={h.setOpenDrawer}
                editMode={h.editMode}
                formData={h.formData} handleInputChange={h.handleInputChange}
                toners={h.toners} tonersDisponibles={h.tonersDisponibles}
                selectedTonerPreview={h.selectedTonerPreview} stockMismoModelo={h.stockMismoModelo}
                entregadoPor={h.entregadoPor} setEntregadoPor={h.setEntregadoPor}
                personas={h.personas} impresoras={h.impresoras}
                selectedPiso={h.selectedPiso} setSelectedPiso={h.setSelectedPiso}
                ambientes={h.ambientes} ambientesFiltrados={h.ambientesFiltrados}
                pisos={h.pisos}
                handleSubmit={h.handleSubmit} resetForm={h.resetForm}
                submitting={h.submitting}
            />

            <ModalTerminar
                openTerminarModal={h.openTerminarModal} setOpenTerminarModal={h.setOpenTerminarModal}
                selectedAsignacion={h.selectedAsignacion}
                terminarData={h.terminarData} setTerminarData={h.setTerminarData}
                handleTerminar={h.handleTerminar}
                submitting={h.submitting}
            />

            <ModalHistorialToners
                openHistorialModal={h.openHistorialModal} setOpenHistorialModal={h.setOpenHistorialModal}
                historialAsignaciones={h.historialAsignaciones}
            />

            <ConfirmDialog
                title="Eliminar asignación de tóner"
                open={!!h.deleteTarget}
                message="¿Estás seguro? El tóner quedará disponible nuevamente."
                onConfirm={h.confirmDelete}
                onCancel={() => h.setDeleteTarget(null)}
                disabled={h.submitting}
            >
                {h.deleteTarget && (
                    <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-sm space-y-1">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            {h.deleteTarget.toner && (
                                <><span className="text-gray-500">Tóner:</span><span className="font-medium">{h.deleteTarget.toner.marca} {h.deleteTarget.toner.modelo} ({h.deleteTarget.toner.color_toner})</span></>
                            )}
                            {h.deleteTarget.toner?.serie && <><span className="text-gray-500">Serie:</span><span className="font-medium">{h.deleteTarget.toner.serie}</span></>}
                            {h.deleteTarget.impresora && (
                                <><span className="text-gray-500">Impresora:</span><span className="font-medium">{h.deleteTarget.impresora.marca} {h.deleteTarget.impresora.modelo}</span></>
                            )}
                            {h.deleteTarget.persona && (
                                <><span className="text-gray-500">Responsable:</span><span className="font-medium">{h.deleteTarget.persona.apellidos} {h.deleteTarget.persona.nombres}</span></>
                            )}
                            {h.deleteTarget.ambiente && (
                                <><span className="text-gray-500">Ambiente:</span><span className="font-medium">{h.deleteTarget.ambiente.nombre}</span></>
                            )}
                            {h.deleteTarget.fecha_asignacion && (
                                <><span className="text-gray-500">Fecha:</span><span className="font-medium">{h.deleteTarget.fecha_asignacion}</span></>
                            )}
                        </div>
                    </div>
                )}
            </ConfirmDialog>
        </div>
    )
}

export default GestionToners
