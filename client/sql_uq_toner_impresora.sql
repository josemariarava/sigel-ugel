-- ============================================
-- BLOQUEO DOBLE ASIGNACIÓN DE TÓNER POR IMPRESORA
-- ============================================
-- Refuerzo a nivel BD de la validación que ya hace
-- el frontend (useGestionToners.jsx): evita que dos
-- usuarios asignen tóner a la misma impresora al
-- mismo tiempo (race condition).
-- Índice único parcial: solo aplica a asignaciones
-- ACTIVAS con impresora; no afecta históricos
-- (estado 'Terminado') ni asignaciones sin impresora.
-- ============================================

-- 1. Limpieza preventiva: si existieran duplicados activos,
--    se finalizan los anteriores y se conserva el más reciente.
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY impresora_id
               ORDER BY fecha_asignacion DESC, id DESC
           ) AS rn
    FROM asignacion_toners
    WHERE estado = 'Activo' AND impresora_id IS NOT NULL
)
UPDATE asignacion_toners a
SET estado = 'Terminado'
FROM ranked r
WHERE a.id = r.id AND r.rn > 1;

-- 2. Índice único parcial
CREATE UNIQUE INDEX IF NOT EXISTS uq_toner_impresora_activo
ON asignacion_toners (impresora_id)
WHERE estado = 'Activo' AND impresora_id IS NOT NULL;
