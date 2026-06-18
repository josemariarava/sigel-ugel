import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  HomeRegular, 
  DesktopRegular,
  PeopleRegular, 
  ClipboardTaskRegular, 
  SettingsRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  DocumentRegular,
  ArchiveRegular
} from '@fluentui/react-icons'
import { Button, Tooltip, Badge } from '@fluentui/react-components'

const Sidebar = ({ activePage, onPageChange, collapsed, onToggleCollapse }) => {
    const { user } = useAuth()
    const [hoveredItem, setHoveredItem] = useState(null)

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: HomeRegular, description: 'Panel principal' },
        { id: 'bienes', label: 'Bienes', icon: DesktopRegular, description: 'Gestión de bienes' },
        { id: 'personas', label: 'Personas', icon: PeopleRegular, description: 'Usuarios y personal' },
        { id: 'bitacora', label: 'Bitácora', icon: DocumentRegular, description: 'Registro de incidencias' },
        { id: 'asignaciones', label: 'Asignaciones', icon: ClipboardTaskRegular, description: 'Asignaciones y préstamos' },
        { id: 'stock-toners', label: 'Stock Toners', icon: ArchiveRegular, description: 'Control de stock' },
        { id: 'configuracion', label: 'Configuración', icon: SettingsRegular, description: 'Ajustes del sistema' },
    ]

    const [expandedItems, setExpandedItems] = useState({})

    const toggleSubMenu = (id) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <div 
            className={`${
                collapsed ? 'w-20' : 'w-72'
            } bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 h-screen fixed left-0 top-0 text-white transition-all duration-300 ease-in-out z-20 shadow-2xl`}
        >
            {/* Header con logo y colapso */}
            <div className={`p-5 border-b border-white/10 relative overflow-hidden group`}>
                {/* Gradient overlay en header */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative flex items-center justify-between">
                    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur-md opacity-50 animate-pulse" />
                            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                                <HomeRegular className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        {!collapsed && (
                            <div className="flex-1">
                                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                                    SIGEL
                                </h1>
                                <p className="text-xs text-blue-300/70 mt-0.5">Sistema de Gestión UGEL</p>
                            </div>
                        )}
                    </div>
                    
                    <Button
                        appearance="subtle"
                        onClick={onToggleCollapse}
                        className={`!text-white/70 hover:!text-white !min-w-8 !w-8 !h-8 ${collapsed ? 'absolute -right-3 top-1/2 -translate-y-1/2' : ''}`}
                        icon={collapsed ? <ChevronRightRegular /> : <ChevronLeftRegular />}
                    />
                </div>
            </div>

            {/* Menú de navegación */}
            <nav className="mt-6 px-3 overflow-y-auto h-[calc(100vh-5rem)] custom-scrollbar">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activePage === item.id
                    const isExpanded = expandedItems[item.id]
                    const hasSubItems = item.subItems && item.subItems.length > 0

                    return (
                        <div key={item.id} className="mb-2">
                            <Tooltip 
                                content={item.description} 
                                relationship="label" 
                                positioning={collapsed ? "after" : "below"}
                                withArrow
                                showDelay={300}
                            >
                                <Button
                                    appearance={isActive ? 'primary' : 'transparent'}
                                    onClick={() => {
                                        if (hasSubItems && !collapsed) {
                                            toggleSubMenu(item.id)
                                        } else {
                                            onPageChange(item.id)
                                        }
                                    }}
                                    onMouseEnter={() => setHoveredItem(item.id)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    className={`
                                        w-full !justify-start !text-sm !font-medium mb-1 relative overflow-hidden
                                        transition-all duration-300 group
                                        ${isActive 
                                            ? '!bg-gradient-to-r !from-blue-600 !to-purple-600 !text-white shadow-lg shadow-blue-500/25' 
                                            : '!text-white/80 hover:!text-white hover:!bg-white/10'
                                        }
                                        ${collapsed ? '!justify-center !px-2' : '!px-3'}
                                    `}
                                    icon={<Icon className={`${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'} transition-colors duration-200`} />}
                                >
                                    {!collapsed && (
                                        <span className="ml-3 flex-1 text-left">{item.label}</span>
                                    )}
                                    
                                    {!collapsed && item.badge && (
                                        <Badge 
                                            appearance={isActive ? "filled" : "tint"}
                                            className={`ml-2 ${isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'}`}
                                        >
                                            {item.badge}
                                        </Badge>
                                    )}

                                    {!collapsed && hasSubItems && (
                                        <ChevronRightRegular 
                                            className={`w-4 h-4 transition-transform duration-200 ${
                                                isExpanded ? 'rotate-90' : ''
                                            }`}
                                        />
                                    )}
                                </Button>
                            </Tooltip>

                            {/* Submenú items */}
                            {!collapsed && hasSubItems && isExpanded && (
                                <div className="ml-7 mt-1 space-y-1 animate-slideDown">
                                    {item.subItems.map((subItem) => {
                                        const SubIcon = subItem.icon
                                        const isSubActive = activePage === subItem.id
                                        
                                        return (
                                            <Button
                                                key={subItem.id}
                                                appearance="transparent"
                                                onClick={() => onPageChange(subItem.id)}
                                                className={`
                                                    w-full !justify-start !text-sm !py-2 !px-3
                                                    transition-all duration-200
                                                    ${isSubActive
                                                        ? '!bg-white/10 !text-white border-l-2 border-blue-500'
                                                        : '!text-white/60 hover:!text-white hover:!bg-white/5'
                                                    }
                                                `}
                                                icon={<SubIcon className="w-4 h-4" />}
                                            >
                                                <span className="ml-3">{subItem.label}</span>
                                            </Button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* Footer con información de usuario */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
                {!collapsed ? (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">
                                            {user?.user_metadata?.nombre
                                                ? user.user_metadata.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                                                : user?.email?.slice(0, 2).toUpperCase() || '??'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'}
                                    </p>
                                    <p className="text-xs text-blue-300/70 truncate">{user?.email || ''}</p>
                                </div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    {user?.user_metadata?.nombre
                                        ? user.user_metadata.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                                        : user?.email?.slice(0, 2).toUpperCase() || '??'}
                                </span>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Sidebar