-- ============================================
-- FASE 16: Limpiar FK duplicada en historial_movimientos.bien_id
-- ============================================
-- phase9 agregó fk_historial_movimientos_bien (ON DELETE SET NULL)
-- pero existía otra FK auto-named con ON DELETE CASCADE → conflicto
-- Se elimina la CASCADE para preservar el historial al eliminar un bien.
-- ============================================

BEGIN;

ALTER TABLE historial_movimientos
DROP CONSTRAINT IF EXISTS historial_movimientos_bien_id_fkey;

COMMIT;
