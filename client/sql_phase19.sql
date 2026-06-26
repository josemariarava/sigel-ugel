-- ============================================================
-- Phase 19: Add UNIQUE constraint on asignacion_toners.numero_acta
-- Prevents duplicate acta numbers (race condition protection)
-- ============================================================

-- 1. Verify there are no existing duplicates
--    (should return 0 rows before applying the constraint)
SELECT numero_acta, COUNT(*)
FROM asignacion_toners
GROUP BY numero_acta
HAVING COUNT(*) > 1;

-- 2. If no duplicates, add the unique constraint
ALTER TABLE asignacion_toners
ADD CONSTRAINT uq_asignacion_toners_numero_acta UNIQUE (numero_acta);

-- ============================================================
-- Note: The client code now handles 23505 (unique_violation)
-- errors with automatic retry (up to 3 attempts) and a new
-- acta number. See useGestionToners.jsx handleSubmit.
-- ============================================================
