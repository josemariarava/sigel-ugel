import {
    EditRegular,
    DeleteRegular,
    LaptopRegular,
    PrintRegular,
    TvRegular,
    PhoneTabletRegular,
    DesktopKeyboardRegular,
    ProjectionScreenRegular
} from '@fluentui/react-icons'
import {
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Tooltip,
    Button,
    Checkbox
} from '@fluentui/react-components'

const condicionBadge = (condicion) => {
    const map = {
        Bueno: 'bg-green-100 text-green-800',
        Regular: 'bg-amber-100 text-amber-800',
        Chatarra: 'bg-gray-200 text-gray-700'
    }
    return `px-2 py-0.5 rounded-full text-xs font-medium ${map[condicion] || 'bg-rose-100 text-rose-800'}`
}

const estadoBadge = (estado) => {
    const map = {
        Activo: 'bg-blue-100 text-blue-800',
        Disponible: 'bg-blue-100 text-blue-800',
        Inactivo: 'bg-gray-200 text-gray-800'
    }
    return `px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] || 'bg-gray-100 text-gray-500'}`
}

const tipoIcono = (tipo) => {
    const map = {
        Laptop: <LaptopRegular className="text-blue-500" />,
        Impresora: <PrintRegular className="text-purple-500" />,
        Monitor: <TvRegular className="text-green-500" />,
        Tablet: <PhoneTabletRegular className="text-black" />,
        Desktop: <DesktopKeyboardRegular className="text-orange-500" />,
        Proyector: <ProjectionScreenRegular className="text-green-500" />
    }
    return map[tipo] || null
}

const BienesTable = ({ filteredBienes, paginatedData, selectedIds, toggleSelect, toggleSelectAll, handleEdit, handleDelete }) => {
    return (
        <div className="overflow-x-auto">
            <Table className="w-full">
                <TableHeader className="sticky top-0 z-10 bg-white">
                    <TableRow>
                        <TableHeaderCell className="w-8">
                            <Checkbox
                                checked={filteredBienes.length === 0 ? false :
                                    selectedIds.size === filteredBienes.length ? true : 'mixed'}
                                onChange={toggleSelectAll}
                            />
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
                    {paginatedData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                                No se encontraron bienes registrados en esta categoría.
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedData.map((bien) => (
                            <TableRow key={bien.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(bien.id) ? 'bg-blue-50' : ''}`}>
                                <TableCell className="w-8">
                                    <Checkbox checked={selectedIds.has(bien.id)} onChange={() => toggleSelect(bien.id)} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {tipoIcono(bien.tipo_equipo)}
                                        <b>{bien.tipo_equipo}</b>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{bien.marca || '-'} {bien.modelo || ''}</span>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
                                        {bien.codigo_patrimonial || 'SIN CÓDIGO'}
                                    </span>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell font-mono text-xs">{bien.serie || '-'}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <span className={condicionBadge(bien.condicion)}>
                                        {bien.condicion}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={estadoBadge(bien.estado)}>
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
    )
}

export default BienesTable
