export const handleApiError = (error, context = '') => {
    const prefix = context ? `[${context}] ` : ''
    console.error(`${prefix}Error:`, error)

    if (error?.message) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return 'Error de conexión con el servidor. Verifique su conexión a internet.'
        }
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            return 'Este registro ya existe en la base de datos.'
        }
        if (error.message.includes('violates row-level security')) {
            return 'No tiene permisos para realizar esta operación.'
        }
        if (error.message.includes('JWT') || error.message.includes('auth')) {
            return 'Su sesión ha expirado. Recargue la página.'
        }
        if (error.message.includes('violates foreign key')) {
            return 'No se puede eliminar porque tiene registros relacionados.'
        }
        return error.message
    }

    return 'Ha ocurrido un error inesperado.'
}
