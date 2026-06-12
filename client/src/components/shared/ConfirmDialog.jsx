import { Button, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions } from '@fluentui/react-components'

const ConfirmDialog = ({ open, title, message, children, confirmText = 'Sí, eliminar', cancelText = 'Cancelar', onConfirm, onCancel, disabled, confirmingText }) => {
    return (
        <Dialog open={open} modalType="modal">
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{title || 'Confirmar eliminación'}</DialogTitle>
                    <DialogContent>
                        <p className="text-sm text-gray-600">{message}</p>
                        {children && <div className="mt-3">{children}</div>}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={onCancel}>{cancelText}</Button>
                        <Button appearance="primary" onClick={onConfirm} disabled={disabled}>{disabled ? (confirmingText || 'Eliminando...') : confirmText}</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    )
}

export default ConfirmDialog
