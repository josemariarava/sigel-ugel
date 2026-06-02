import { useToastController, Toaster } from '@fluentui/react-components'
import {
    AddRegular,
    EditRegular,
    DeleteRegular,
    SearchRegular,
    ArrowSyncRegular,
    BuildingRegular,
    LocationRegular,
    PersonRegular,
    ArrowSwapRegular,
    HistoryRegular,
    DocumentPdfRegular,
    EyeRegular,
    CartRegular,
    TableRegular,
    WarningRegular
} from '@fluentui/react-icons'
import {
    Button,
    Badge,
    Tooltip
} from '@fluentui/react-components'

import { useAsignaciones } from '../hooks/useAsignaciones.jsx'
import GestionToners from './GestionToners'
import DrawerAsignacion from '../components/asignaciones/DrawerAsignacion'
import DrawerTraslado from '../components/asignaciones/DrawerTraslado'
import DrawerDetalle from '../components/asignaciones/DrawerDetalle'
import DrawerHistorial from '../components/asignaciones/DrawerHistorial'
import ModalReporte from '../components/asignaciones/ModalReporte'
import ConfirmDialog from '../components/shared/ConfirmDialog'

const Asignaciones = () => {
    const { dispatchToast } = useToastController()
    const h = useAsignaciones(dispatchToast)

    return (
        <div className="p-1 space-y-6 max-w-[1600px] mx-auto font-sans antialiased text-slate-900">
            <Toaster />

            {/* ENCABEZADO */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                        Gestión de Asignaciones
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">Trazabilidad de bienes patrimoniales distribuidos por personal y ambientes físicos</p>
                </div>
                {h.activeTab !== 'toners' && (
                    <Button appearance="primary" icon={<AddRegular />} onClick={() => { h.resetForm(); h.openModalAsignacion() }}>
                        Nueva Asignación
                    </Button>
                )}
            </div>

            {/* TABS DE NAVEGACIÓN INTERNA */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-1">
                    <button
                        onClick={() => h.setActiveTab('lista')}
                        className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${h.activeTab === 'lista'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <TableRegular />
                            <span>Lista de Asignaciones</span>
                        </div>
                    </button>
                    <button
                        onClick={() => h.setActiveTab('mapa')}
                        className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${h.activeTab === 'mapa'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <BuildingRegular />
                            <span>Distribución por Ubicación</span>
                        </div>
                    </button>

                    <button
                        onClick={() => h.setActiveTab('toners')}
                        className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${h.activeTab === 'toners'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <CartRegular />
                            <span>🧴 Consumibles (Tóner)</span>
                        </div>
                    </button>
                </nav>
            </div>

            {/* CONTENIDO SEGÚN TAB ACTIVA */}
            {h.activeTab === 'lista' ? (
                <>
                    {/* FILTROS AVANZADOS */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <SearchRegular className="text-blue-500" /> Filtros Avanzados
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input type="date" placeholder="Desde" value={h.filtros.fechaInicio} onChange={(e) => h.setFiltros({ ...h.filtros, fechaInicio: e.target.value })} className="text-xs border rounded-lg px-3 py-2" />
                            <input type="date" placeholder="Hasta" value={h.filtros.fechaFin} onChange={(e) => h.setFiltros({ ...h.filtros, fechaFin: e.target.value })} className="text-xs border rounded-lg px-3 py-2" />
                            <select value={h.filtros.tipoBien} onChange={(e) => h.setFiltros({ ...h.filtros, tipoBien: e.target.value })} className="text-xs border rounded-lg px-3 py-2">
                                <option value="">Todos los tipos</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Desktop">Desktop</option>
                                <option value="Proyector">Proyector</option>
                                <option value="Impresora">Impresora</option>
                            </select>
                            <select value={h.filtros.estadoFiltro} onChange={(e) => h.setFiltros({ ...h.filtros, estadoFiltro: e.target.value })} className="text-xs border rounded-lg px-3 py-2">
                                <option value="">Todos los estados</option>
                                <option value="Activo">Activo</option>
                                <option value="Trasladado">Trasladado</option>
                                <option value="Devuelto">Devuelto</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>
                    </div>

                    {/* BARRA DE ACCIONES */}
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
                        <div className="relative flex-1 w-full">
                            <SearchRegular className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Buscar por equipo, código, responsable..." value={h.searchTerm} onChange={(e) => h.setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-xs border rounded-lg" />
                        </div>
                        <div className="flex gap-2">
                            <Button size="small" icon={<DocumentPdfRegular />} onClick={h.exportarAPdf} disabled={h.exportandoPdf}>PDF</Button>
                            <Button size="small" icon={<ArrowSyncRegular />} onClick={h.exportarAExcel} disabled={h.exportando}>Excel</Button>
                            <Button size="small" icon={<HistoryRegular />} onClick={h.generarReportePorPeriodo}>Reporte</Button>
                            <Button size="small" icon={<ArrowSyncRegular />} onClick={h.cargarDatos}>Sync</Button>
                        </div>
                    </div>

                    {/* TABLA PRINCIPAL */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {h.loading ? (
                            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3.5">Bien</th>
                                            <th className="px-6 py-3.5">Código</th>
                                            <th className="px-6 py-3.5">N° Acta</th>
                                            <th className="px-6 py-3.5">Responsable</th>
                                            <th className="px-6 py-3.5">Ubicación</th>
                                            <th className="px-6 py-3.5">Fecha</th>
                                            <th className="px-6 py-3.5">Estado</th>
                                            <th className="px-6 py-3.5 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-xs">
                                        {h.asignacionesFiltradasAvanzado.map((asig) => (
                                            <tr key={asig.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-3.5 font-semibold">
                                                    {asig.bien?.tipo_equipo}
                                                    <div className="text-[10px] text-gray-400">{asig.bien?.marca} {asig.bien?.modelo}</div>
                                                </td>
                                                <td className="px-6 py-3.5 font-mono text-xs">{asig.bien?.codigo_patrimonial}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs text-blue-700">{asig.numero_acta || '—'}</td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => h.verBienesPorPersona(asig.persona_id, asig.persona?.nombres, asig.persona?.apellidos)}>
                                                        <PersonRegular className="text-gray-400" />
                                                        <span className="hover:text-blue-600 hover:underline">{asig.persona?.apellidos}, {asig.persona?.nombres}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">{asig.ambiente?.nombre || 'Almacén'}</td>
                                                <td className="px-6 py-3.5">{asig.fecha_asignacion}</td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${h.getEstadoColor(asig.estado_asignacion)}`}>
                                                        {asig.estado_asignacion}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex gap-1 justify-center">
                                                        <Tooltip content="Ver bienes"><Button size="small" appearance="subtle" icon={<EyeRegular />} onClick={() => h.verBienesPorPersona(asig.persona_id, asig.persona?.nombres, asig.persona?.apellidos)} /></Tooltip>
                                                        <Tooltip content="Acta cargo"><Button size="small" appearance="subtle" icon={<DocumentPdfRegular />} className="text-green-600" onClick={() => h.generarActaCargo(asig.persona_id, asig.persona?.nombres, asig.persona?.apellidos, asig.persona)} /></Tooltip>
                                                        <Tooltip content="Trasladar"><Button size="small" appearance="subtle" icon={<ArrowSwapRegular />} onClick={() => { h.setSelectedAsignacion(asig); h.setOpenTrasladoModal(true) }} /></Tooltip>
                                                        <Tooltip content="Historial"><Button size="small" appearance="subtle" icon={<HistoryRegular />} onClick={() => { h.cargarHistorialMovimientos(asig.bien_id, asig.bien); h.setOpenHistorialModal(true) }} /></Tooltip>
                                                        {asig.acta_url ? (
                                                            <Tooltip content="Ver Acta">
                                                                <a href={asig.acta_url} target="_blank" rel="noopener noreferrer">
                                                                    <Button size="small" appearance="subtle" icon={<EyeRegular />} className="text-blue-600" />
                                                                </a>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip content="Generar Acta">
                                                                <Button size="small" appearance="subtle" icon={<DocumentPdfRegular />} className="text-red-600" onClick={() => h.generarActaAsignacion(asig)} />
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip content="Editar"><Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => h.handleEdit(asig)} /></Tooltip>
                                                        <Tooltip content="Eliminar"><Button size="small" appearance="subtle" icon={<DeleteRegular />} className="text-red-500" onClick={() => h.handleDelete(asig)} /></Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : h.activeTab === 'mapa' ? (
                <>
                    {/* MAPA DE UBICACIONES */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-gray-400">
                                <BuildingRegular className="text-blue-600 text-lg" />
                                Distribución por Ubicación (Click para ver bienes)
                            </h2>
                            <Badge appearance="filled" color="brand">
                                {h.todosLosAmbientes.length} ambientes
                            </Badge>
                        </div>

                        <div className="flex gap-1 mb-4 border-b border-gray-200">
                            <button
                                onClick={() => h.setDistribucionVista('piso')}
                                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-all ${h.distribucionVista === 'piso'
                                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <BuildingRegular style={{ fontSize: '14px' }} className="inline mr-1" />
                                Por Piso
                            </button>
                            <button
                                onClick={() => h.setDistribucionVista('area')}
                                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-all ${h.distribucionVista === 'area'
                                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                📋 Por Área
                            </button>
                        </div>

                        {h.distribucionVista === 'piso' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {h.obtenerPisosMapa().map((piso) => (
                                    <div key={piso.id} className="bg-slate-50/60 rounded-xl border border-slate-200/60 overflow-hidden flex flex-col">
                                        <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center">
                                            <span className="text-xs font-bold font-mono">{piso.nombre || `PISO ${piso.numero}`}</span>
                                            {piso.numero === 0 && <Badge appearance="filled" color="warning">Almacén</Badge>}
                                        </div>
                                        <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto">
                                            {piso.ambientes.map((ambiente) => {
                                                const cantidad = h.asignaciones.filter(a => a.ambiente_id === ambiente.id && a.estado_asignacion === 'Activo').length
                                                return (
                                                    <div
                                                        key={ambiente.id}
                                                        className="bg-white p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                                                        onClick={() => h.verBienesPorUbicacion(ambiente.id)}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs font-semibold text-slate-800">{ambiente.nombre}</p>
                                                            <Badge appearance={cantidad > 0 ? "filled" : "outline"} color={cantidad > 0 ? "brand" : "neutral"}>
                                                                {cantidad} bienes
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[10px] font-mono text-gray-400 mt-1">{ambiente.codigo}</p>
                                                        {ambiente.area && (
                                                            <p className="text-[10px] text-blue-600 mt-0.5">{ambiente.area.nombre}</p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {h.obtenerAreasMapa().map((area) => (
                                    <div key={area.id} className="bg-slate-50/60 rounded-xl border border-slate-200/60 overflow-hidden flex flex-col">
                                        <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-4 py-2.5 flex justify-between items-center">
                                            <span className="text-xs font-bold font-mono">{area.nombre}</span>
                                            <Badge appearance="filled" color="neutral">
                                                {area.ambientes.length} ambientes
                                            </Badge>
                                        </div>
                                        <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto">
                                            {area.ambientes.map((ambiente) => {
                                                const cantidad = h.asignaciones.filter(a => a.ambiente_id === ambiente.id && a.estado_asignacion === 'Activo').length
                                                return (
                                                    <div
                                                        key={ambiente.id}
                                                        className="bg-white p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                                                        onClick={() => h.verBienesPorUbicacion(ambiente.id)}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs font-semibold text-slate-800">{ambiente.nombre}</p>
                                                            <Badge appearance={cantidad > 0 ? "filled" : "outline"} color={cantidad > 0 ? "brand" : "neutral"}>
                                                                {cantidad} bienes
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[10px] font-mono text-gray-400 mt-1">{ambiente.codigo}</p>
                                                        {ambiente.piso && (
                                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                                <BuildingRegular style={{ fontSize: '11px' }} className="inline mr-0.5" />
                                                                {ambiente.piso.nombre || `Piso ${ambiente.piso.numero}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TARJETAS ESTADÍSTICAS */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Total</p>
                            <p className="text-2xl font-bold">{h.estadisticas.totalAsignaciones}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Activos</p>
                            <p className="text-2xl font-bold">{h.estadisticas.activos}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Trasladados</p>
                            <p className="text-2xl font-bold">{h.estadisticas.trasladados}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Devueltos</p>
                            <p className="text-2xl font-bold">{h.estadisticas.devueltos}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Baja</p>
                            <p className="text-2xl font-bold">{h.estadisticas.baja}</p>
                        </div>
                        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-3 text-white shadow-lg">
                            <p className="text-xs opacity-90">Almacén</p>
                            <p className="text-2xl font-bold">{h.estadisticas.enAlmacen}</p>
                        </div>
                    </div>
                </>
            ) : (
                <GestionToners />
            )}

            {/* DRAWERS Y MODALES */}
            <DrawerAsignacion
                openModal={h.openModal} setOpenModal={h.setOpenModal}
                editMode={h.editMode}
                formData={h.formData} setFormData={h.setFormData}
                searchTermBien={h.searchTermBien} setSearchTermBien={h.setSearchTermBien}
                showBienDropdown={h.showBienDropdown} setShowBienDropdown={h.setShowBienDropdown}
                bienesFiltrados={h.bienesFiltrados} bienes={h.bienes}
                personas={h.personas} pisos={h.pisos}
                todosLosAmbientes={h.todosLosAmbientes} ambientesFiltrados={h.ambientesFiltrados}
                selectedPiso={h.selectedPiso} setSelectedPiso={h.setSelectedPiso}
                infoResponsable={h.infoResponsable} infoAmbiente={h.infoAmbiente}
                areas={h.areas}
                handlePersonaChange={h.handlePersonaChange}
                handleAmbienteChange={h.handleAmbienteChange}
                handleInputChange={h.handleInputChange}
                handleSubmit={h.handleSubmit} resetForm={h.resetForm}
                getCondicionBadge={h.getCondicionBadge} getEstadoBienBadge={h.getEstadoBienBadge}
            />

            <DrawerDetalle
                openDetalleModal={h.openDetalleModal} setOpenDetalleModal={h.setOpenDetalleModal}
                selectedPersonaDetalle={h.selectedPersonaDetalle} bienesPorPersona={h.bienesPorPersona}
                generarActaCargo={h.generarActaCargo} personas={h.personas}
            />

            <DrawerTraslado
                openTrasladoModal={h.openTrasladoModal} setOpenTrasladoModal={h.setOpenTrasladoModal}
                selectedAsignacion={h.selectedAsignacion}
                trasladoData={h.trasladoData} setTrasladoData={h.setTrasladoData}
                infoNuevoResponsable={h.infoNuevoResponsable} infoNuevoAmbiente={h.infoNuevoAmbiente}
                handleNuevoResponsableChange={h.handleNuevoResponsableChange}
                handleNuevoAmbienteChange={h.handleNuevoAmbienteChange}
                handleTraslado={h.handleTraslado} resetTrasladoForm={h.resetTrasladoForm}
                personas={h.personas} todosLosAmbientes={h.todosLosAmbientes}
            />

            <DrawerHistorial
                openHistorialModal={h.openHistorialModal} setOpenHistorialModal={h.setOpenHistorialModal}
                historialMovimientos={h.historialMovimientos} loadingHistorial={h.loadingHistorial}
                historialBienInfo={h.historialBienInfo} areas={h.areas}
            />

            <ModalReporte
                openReporteModal={h.openReporteModal} setOpenReporteModal={h.setOpenReporteModal}
                reporteData={h.reporteData} fechasReporte={h.fechasReporte}
            />

            <ConfirmDialog
                title="Eliminar asignación"
                open={!!h.deleteTarget}
                message="¿Eliminar este registro? Esta acción no se puede deshacer."
                onConfirm={h.confirmDelete}
                onCancel={() => h.setDeleteTarget(null)}
            >
                {h.deleteTarget && (
                    <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-sm space-y-1">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            {h.deleteTarget.bien && (
                                <><span className="text-gray-500">Bien:</span><span className="font-medium">{h.deleteTarget.bien.tipo_equipo} {h.deleteTarget.bien.marca} {h.deleteTarget.bien.modelo}</span></>
                            )}
                            {h.deleteTarget.bien?.serie && <><span className="text-gray-500">Serie:</span><span className="font-medium">{h.deleteTarget.bien.serie}</span></>}
                            {h.deleteTarget.persona && (
                                <><span className="text-gray-500">Asignado a:</span><span className="font-medium">{h.deleteTarget.persona.apellidos} {h.deleteTarget.persona.nombres}</span></>
                            )}
                            {h.deleteTarget.ambiente && (
                                <><span className="text-gray-500">Ambiente:</span><span className="font-medium">{h.deleteTarget.ambiente.nombre}</span></>
                            )}
                            <span className="text-gray-500">Estado:</span>
                            <span className="font-medium">{h.deleteTarget.estado_asignacion}</span>
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

export default Asignaciones
