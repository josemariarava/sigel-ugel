-- ============================================
-- FIX: Renumerar actas de bienes que colisionan
-- con el correlativo unificado de tóners.
-- Requiere haber ejecutado antes sql_acta_unica.sql
-- ============================================

BEGIN;

-- 1. Verificación: actas de bienes que colisionan con tóners
SELECT a.id, a.numero_acta, a.fecha_asignacion
FROM asignaciones a
WHERE EXISTS (
    SELECT 1 FROM asignacion_toners t
    WHERE t.numero_acta = a.numero_acta
);

-- 2. Renumerar: la única acta de bienes colisionante pasa a 0009
--    (sigue después del 0008 de tóners). Ajustar el número si el
--    máximo de tóners es otro.
UPDATE asignaciones
SET numero_acta = '0009-2026'
WHERE numero_acta = '0001-2026'
  AND EXISTS (SELECT 1 FROM asignacion_toners WHERE numero_acta = '0001-2026');

-- 3. Subir el contador al nuevo máximo para que la próxima acta
--    (de cualquier módulo) sea 0010-2026
UPDATE correlativos_actas
SET ultimo = GREATEST(ultimo, 9)
WHERE anio = 2026;

-- 4. Verificación final
SELECT * FROM correlativos_actas ORDER BY anio;

COMMIT;
