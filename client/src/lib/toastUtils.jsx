import { Toast, ToastTitle, ToastBody } from '@fluentui/react-components'

export function buildMostrarToast(dispatchToast) {
    return (mensaje, tipo = 'success') => {
        dispatchToast(
            <Toast>
                <ToastTitle>{tipo === 'success' ? '✅ Éxito' : '❌ Error'}</ToastTitle>
                <ToastBody>{mensaje}</ToastBody>
            </Toast>,
            { intent: tipo }
        )
    }
}
