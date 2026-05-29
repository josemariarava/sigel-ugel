import { useNavigate, useLocation } from 'react-router-dom'
import { 
    HomeRegular, 
    DesktopRegular,
    PeopleRegular, 
    ClipboardTaskRegular, 
    SettingsRegular,
    BuildingRegular,
    DataUsageRegular
} from '@fluentui/react-icons'
import { Button, Tooltip } from '@fluentui/react-components'

const Sidebar = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: HomeRegular, path: '/dashboard' },
        { id: 'bienes', label: 'Bienes', icon: DesktopRegular, path: '/bienes' },
        { id: 'stock', label: 'Stock Tóneres', icon: DataUsageRegular, path: '/stock-toners' },
        { id: 'personas', label: 'Personas', icon: PeopleRegular, path: '/personas' },
        { id: 'ubicaciones', label: 'Ubicaciones', icon: BuildingRegular, path: '/ambientes' },
        { id: 'asignaciones', label: 'Asignaciones', icon: ClipboardTaskRegular, path: '/asignaciones' },
        { id: 'configuracion', label: 'Configuración', icon: SettingsRegular, path: '/configuracion' },
    ]

    return (
        <div className="w-64 bg-gray-900 h-screen fixed left-0 top-0 text-white">
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-xl font-bold">UGEL 2026</h1>
                <p className="text-xs text-gray-400 mt-1">Sistema Patrimonial</p>
            </div>

            <nav className="mt-6 px-2">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <Tooltip key={item.id} content={item.label} relationship="label" positioning="after">
                            <Button
                                appearance={location.pathname === item.path ? 'primary' : 'transparent'}
                                onClick={() => navigate(item.path)}
                                className="w-full !justify-start !text-white mb-1"
                                icon={<Icon />}
                            >
                                <span className="ml-2">{item.label}</span>
                            </Button>
                        </Tooltip>
                    )
                })}
            </nav>
        </div>
    )
}

export default Sidebar