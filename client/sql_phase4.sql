-- ============================================
-- FASE 4: Ampliar check constraint de bienes.estado
-- ============================================

-- 1. Eliminar el constraint actual
ALTER TABLE bienes
    DROP CONSTRAINT IF EXISTS bienes_estado_check;

-- 2. Crear nuevo constraint con todos los valores necesarios
ALTER TABLE bienes
    ADD CONSTRAINT bienes_estado_check
    CHECK (estado IN ('Activo', 'Dado de Baja', 'Disponible', 'Asignado', 'Agotado'));

-- 3. Actualizar toners existentes:
--    Los toners con estado 'Activo' que NO tengan asignación activa -> 'Disponible'
UPDATE bienes
SET estado = 'Disponible'
WHERE tipo_equipo = 'Tóner'
  AND estado = 'Activo'
  AND id NOT IN (
      SELECT DISTINCT toner_id FROM asignacion_toners WHERE estado = 'Activo'
  );

--    Los toners con estado 'Activo' que SÍ tengan asignación activa -> 'Asignado'
UPDATE bienes
SET estado = 'Asignado'
WHERE tipo_equipo = 'Tóner'
  AND estado = 'Activo'
  AND id IN (
      SELECT DISTINCT toner_id FROM asignacion_toners WHERE estado = 'Activo'
  );
