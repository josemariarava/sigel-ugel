import { 
  Search24Regular,
  PersonCircle24Regular,
  Settings24Regular
} from '@fluentui/react-icons'
import { Input, Button, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from '@fluentui/react-components'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <div className="bg-white shadow-sm h-16 fixed top-0 right-0 left-72 z-10">
            <div className="flex items-center justify-between h-full px-6">
                {/* Búsqueda */}
                <div className="w-96">
                    <Input
                        placeholder="Buscar bien, persona o código..."
                        contentBefore={<Search24Regular />}
                        className="w-full"
                    />
                </div>
                
                {/* Usuario */}
                <div className="flex items-center gap-4">
                    <Button appearance="subtle" icon={<Settings24Regular />} />
                
                    <Menu>
                        <MenuTrigger disableButtonEnhancement>
                            <Button appearance="subtle" icon={<PersonCircle24Regular size={24} />}>
                                <span className='text-gray-600 font-extralight'>Bienvenido, </span>
                                <span className="ml-1 hidden md:inline text-gray-800 font-medium truncate max-w-[150px]">
                                    {user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'}
                                </span>
                            </Button>
                        </MenuTrigger>

                        <MenuPopover>
                            <MenuList>
                                <MenuItem disabled className="text-xs text-gray-400">
                                    {user?.email}
                                </MenuItem>
                                <MenuItem>Mi Perfil</MenuItem>
                                <MenuItem>Configuración</MenuItem>
                                <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
                            </MenuList>
                        </MenuPopover>
                    </Menu>
                </div>
            </div>
        </div>
    )
}

export default Navbar
