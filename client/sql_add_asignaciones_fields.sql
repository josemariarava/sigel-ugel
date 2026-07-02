-- Agregar columnas faltantes a la tabla asignaciones
-- persona_origen_id: quién entregó/asignó el bien (FK a personas)
-- motivo: razón de la asignación
-- documento_referencia: documento de respaldo (ya existía en historial_movimientos)

ALTER TABLE asignaciones ADD COLUMN IF NOT EXISTS persona_origen_id UUID REFERENCES personas(id) ON DELETE SET NULL;
ALTER TABLE asignaciones ADD COLUMN IF NOT EXISTS motivo TEXT;
ALTER TABLE asignaciones ADD COLUMN IF NOT EXISTS documento_referencia TEXT;

-- Backfill: migrar datos existentes desde historial_movimientos
-- Toma el primer movimiento de tipo 'Asignación Inicial' para cada bien
UPDATE asignaciones a
SET
    persona_origen_id = sub.persona_origen_id,
    motivo = sub.motivo,
    documento_referencia = sub.documento_referencia
FROM (
    SELECT DISTINCT ON (hm.bien_id)
        hm.bien_id,
        hm.persona_origen_id,
        hm.motivo,
        hm.documento_referencia
    FROM historial_movimientos hm
    INNER JOIN tipos_movimiento tm ON tm.id = hm.tipo_movimiento_id
    WHERE tm.nombre ILIKE '%asignación%'
    ORDER BY hm.bien_id, hm.created_at ASC
) sub
WHERE a.id = (
    SELECT as2.id FROM asignaciones as2
    WHERE as2.bien_id = sub.bien_id
    ORDER BY as2.created_at ASC
    LIMIT 1
)
AND a.persona_origen_id IS NULL;
