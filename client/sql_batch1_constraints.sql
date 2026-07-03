-- ============================================================
-- Batch 1: DB schema constraints
-- 1a. Partial unique index: one active toner per impresora
-- 1b. UNIQUE constraint on bienes.codigo_patrimonial
-- ============================================================

-- ============================================================
-- 1a. Unique index: solo 1 toner activo por impresora
-- ============================================================
-- Previene race condition TOCTOU entre SELECT e INSERT
-- (paralelo al existente idx_asignacion_toners_activa_unique)
-- ============================================================

-- Verificar que no hay conflictos antes de aplicar
SELECT impresora_id, COUNT(*)
FROM asignacion_toners
WHERE estado = 'Activo' AND impresora_id IS NOT NULL
GROUP BY impresora_id
HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_asignacion_toners_impresora_activa
    ON asignacion_toners (impresora_id)
    WHERE estado = 'Activo';

-- ============================================================
-- 1b. UNIQUE constraint en bienes.codigo_patrimonial
-- ============================================================

-- Verificar duplicados existentes (debe devolver 0 filas)
SELECT codigo_patrimonial, COUNT(*)
FROM bienes
WHERE codigo_patrimonial IS NOT NULL
GROUP BY codigo_patrimonial
HAVING COUNT(*) > 1;

-- Si no hay duplicados, aplicar constraint
-- (permite NULLs múltiples — estándar SQL)
ALTER TABLE bienes
ADD CONSTRAINT bienes_codigo_patrimonial_unique UNIQUE (codigo_patrimonial);
