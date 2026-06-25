-- ============================================
-- FASE 17: UNIQUE en asignaciones.numero_acta
-- ============================================
-- Previene colisiones de número de acta cuando
-- dos usuarios crean asignaciones simultáneamente.
-- ============================================

BEGIN;

-- Limpiar duplicados existentes antes del constraint
UPDATE asignaciones
SET numero_acta = CONCAT(numero_acta, '-', SUBSTRING(id::text, 1, 8))
WHERE numero_acta IN (
    SELECT numero_acta FROM (
        SELECT numero_acta FROM asignaciones
        WHERE numero_acta IS NOT NULL
        GROUP BY numero_acta
        HAVING COUNT(*) > 1
    ) dups
);

ALTER TABLE asignaciones
ADD CONSTRAINT asignaciones_numero_acta_key UNIQUE (numero_acta);

COMMIT;
