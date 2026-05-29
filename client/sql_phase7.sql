-- ============================================
-- FASE 7: Acta PDF por asignación (equipos)
-- ============================================

ALTER TABLE asignaciones ADD COLUMN IF NOT EXISTS acta_url TEXT;
