import { Button, Select } from '@fluentui/react-components'

const BatchActionBar = ({ selectedCount, batchCondicion, setBatchCondicion, onApply, onCancel, updating }) => {
    return (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
            <span className="text-sm font-medium text-blue-800">
                {selectedCount} seleccionado(s)
            </span>
            <div className="flex items-center gap-2 ml-auto">
                <Select
                    value={batchCondicion}
                    onChange={(e) => setBatchCondicion(e.target.value)}
                    placeholder="Nueva condición"
                    className="text-sm"
                >
                    <option value="">Cambiar condición a...</option>
                    <option value="Bueno">✅ Bueno</option>
                    <option value="Regular">⚠️ Regular</option>
                    <option value="Malo">❌ Malo</option>
                    <option value="Chatarra">🗑️ Chatarra</option>
                </Select>
                <Button
                    appearance="primary"
                    size="small"
                    onClick={onApply}
                    disabled={!batchCondicion || updating}
                >
                    {updating ? 'Actualizando...' : 'Aplicar'}
                </Button>
                <Button
                    appearance="subtle"
                    size="small"
                    onClick={onCancel}
                >
                    Cancelar
                </Button>
            </div>
        </div>
    )
}

export default BatchActionBar
