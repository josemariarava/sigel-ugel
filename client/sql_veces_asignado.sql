-- ============================================
-- veces_asignado: contador de usos por tóner
-- ============================================
-- Permite identificar visualmente si un tóner
-- disponible ya fue usado antes (devuelto a stock)
-- vs uno que nunca se ha asignado.
-- ============================================

-- 1. Nueva columna (default 0)
ALTER TABLE bienes ADD COLUMN IF NOT EXISTS veces_asignado INTEGER DEFAULT 0;

-- 2. Backfill desde toner_movimientos (más preciso que
--    asignacion_toners porque Devolver a stock elimina
--    el registro de asignación)
UPDATE bienes b
SET veces_asignado = (
    SELECT COUNT(*) FROM toner_movimientos m
    WHERE m.toner_id = b.id AND m.tipo = 'asignacion'
);

-- 3. Función RPC para incrementar desde el frontend
--    (más seguro que read+update, evita race conditions)
CREATE OR REPLACE FUNCTION incrementar_veces_asignado(toner_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE bienes
    SET veces_asignado = COALESCE(veces_asignado, 0) + 1
    WHERE id = toner_id;
END;
$$ LANGUAGE plpgsql;