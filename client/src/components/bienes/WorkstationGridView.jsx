import { useMemo, useState, useEffect } from 'react'
import StationCard from './StationCard'
import StationDetailDialog from './StationDetailDialog'
import PaginationBar from './PaginationBar'

const STATIONS_PER_PAGE = 20

const computoTypes = ['Laptop', 'Desktop', 'CPU', 'Tablet', 'All-in-One']

const WorkstationGridView = ({ bienes, handleEdit, handleDelete }) => {
    const [stationPage, setStationPage] = useState(1)
    const [selectedStation, setSelectedStation] = useState(null)
    const [pendingEdit, setPendingEdit] = useState(null)

    useEffect(() => {
        if (pendingEdit) {
            handleEdit(pendingEdit)
            setPendingEdit(null)
        }
    }, [pendingEdit, handleEdit])

    const groups = useMemo(() => {
        const map = {}
        const ungroupedCpus = []

        bienes.forEach(b => {
            if (b.codigo_ti) {
                if (!map[b.codigo_ti]) map[b.codigo_ti] = []
                map[b.codigo_ti].push(b)
            } else if (computoTypes.includes(b.tipo_equipo)) {
                ungroupedCpus.push(b)
            }
        })

        const stations = Object.entries(map)
            .filter(([, assets]) => assets.some(a => computoTypes.includes(a.tipo_equipo)))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([codigoTi, assets]) => ({ codigoTi, count: assets.length, assets }))

        const ungrouped = ungroupedCpus.length > 0
            ? [{ codigoTi: 'CPU sin estación', count: ungroupedCpus.length, assets: ungroupedCpus }]
            : []

        return [...stations, ...ungrouped]
    }, [bienes])

    const totalStationPages = Math.max(1, Math.ceil(groups.length / STATIONS_PER_PAGE))
    const paginatedGroups = groups.slice(
        (stationPage - 1) * STATIONS_PER_PAGE,
        stationPage * STATIONS_PER_PAGE
    )

    if (groups.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                No se encontraron estaciones de trabajo.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500 font-medium">
                {groups.length} estacion{groups.length !== 1 ? 'es' : ''} encontrada{groups.length !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedGroups.map(group => (
                    <StationCard
                        key={group.codigoTi}
                        codigoTi={group.codigoTi}
                        count={group.count}
                        assets={group.assets}
                        onClick={() => setSelectedStation(group)}
                    />
                ))}
            </div>

            <PaginationBar
                currentPage={stationPage}
                setCurrentPage={setStationPage}
                totalPages={totalStationPages}
                pageSize={STATIONS_PER_PAGE}
                totalItems={groups.length}
            />

            <StationDetailDialog
                open={!!selectedStation}
                codigoTi={selectedStation?.codigoTi}
                assets={selectedStation?.assets}
                onClose={() => setSelectedStation(null)}
                onEdit={(bien) => {
                    setSelectedStation(null)
                    setPendingEdit(bien)
                }}
                onDelete={handleDelete}
            />
        </div>
    )
}

export default WorkstationGridView
