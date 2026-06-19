import {
    Dialog,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Card,
    Badge
} from '@fluentui/react-components'
import {
    EditRegular,
    LaptopRegular,
    PrintRegular,
    TvRegular,
    PhoneTabletRegular,
    DesktopKeyboardRegular,
    ProjectionScreenRegular
} from '@fluentui/react-icons'

const tipoIcono = (tipo) => {
    const map = {
        Laptop: <LaptopRegular className="text-blue-500 w-5 h-5" />,
        Impresora: <PrintRegular className="text-purple-500 w-5 h-5" />,
        Monitor: <TvRegular className="text-green-500 w-5 h-5" />,
        Tablet: <PhoneTabletRegular className="text-black w-5 h-5" />,
        Desktop: <DesktopKeyboardRegular className="text-orange-500 w-5 h-5" />,
        Proyector: <ProjectionScreenRegular className="text-green-500 w-5 h-5" />
    }
    return map[tipo] || <DesktopKeyboardRegular className="text-gray-400 w-5 h-5" />
}

const StationDetailDialog = ({ open, onClose, codigoTi, assets, onEdit }) => (
    <Dialog open={open} onOpenChange={(_, d) => { if (!d.open) onClose() }} modalType="modal">
        <DialogSurface>
            <DialogBody>
                <DialogTitle>
                    <div className="flex items-center gap-2">
                        <LaptopRegular className="text-blue-600" />
                        <span>Estación: {codigoTi}</span>
                        <Badge appearance="filled" size="small">{assets?.length || 0} equipos</Badge>
                    </div>
                </DialogTitle>
                <DialogContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                        {assets?.map((bien) => (
                            <Card key={bien.id} className="!p-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">{tipoIcono(bien.tipo_equipo)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <b className="text-sm truncate">{bien.tipo_equipo}</b>
                                        </div>
                                        <p className="text-xs text-gray-600 truncate">
                                            {bien.marca || '-'} {bien.modelo || ''}
                                        </p>
                                        <p className="text-xs font-mono text-gray-400 truncate">
                                            {bien.serie || bien.codigo_patrimonial || '-'}
                                        </p>
                                        <div className="flex gap-1 mt-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${bien.condicion === 'Bueno' ? 'bg-green-100 text-green-800' : bien.condicion === 'Regular' ? 'bg-amber-100 text-amber-800' : bien.condicion === 'Chatarra' ? 'bg-gray-200 text-gray-700' : 'bg-rose-100 text-rose-800'}`}>
                                                {bien.condicion}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${bien.estado === 'Activo' || bien.estado === 'Disponible' ? 'bg-blue-100 text-blue-800' : bien.estado === 'Inactivo' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-500'}`}>
                                                {bien.estado}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        appearance="subtle"
                                        icon={<EditRegular />}
                                        size="small"
                                        onClick={() => onEdit(bien)}
                                        title="Editar"
                                    />
                                </div>
                            </Card>
                        ))}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button appearance="secondary" onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </DialogBody>
        </DialogSurface>
    </Dialog>
)

export default StationDetailDialog
