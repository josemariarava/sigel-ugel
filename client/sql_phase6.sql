-- ============================================
-- FASE 6: Migrar GestionToners de oficinas a ambientes
-- ============================================

-- 1. Agregar columna ambiente_id a asignacion_toners
ALTER TABLE asignacion_toners ADD COLUMN IF NOT EXISTS ambiente_id UUID REFERENCES ambientes(id);

-- 2. Backfill: mapear oficina_id → oficinas.nombre → ambientes.nombre → ambiente_id
UPDATE asignacion_toners a
SET ambiente_id = amb.id
FROM oficinas ofi
INNER JOIN ambientes amb ON LOWER(TRIM(ofi.nombre)) = LOWER(TRIM(amb.nombre))
WHERE a.oficina_id = ofi.id
  AND a.ambiente_id IS NULL;
