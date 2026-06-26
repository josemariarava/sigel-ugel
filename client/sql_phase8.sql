-- ============================================
-- FASE 8: Corregir estados inconsistentes de tóneres
-- ============================================
-- Este script corrige tóneres cuyo bienes.estado quedó desincronizado
-- al eliminar asignaciones sin que se actualice correctamente el estado.
--
-- Problema original:
--   Al eliminar una asignación de tóner (confirmDelete en useGestionToners),
--   primero se borraba asignacion_toners y luego se actualizaba bienes.estado.
--   Si el UPDATE fallaba (RLS, red, etc.), el tóner quedaba con estado
--   'Asignado' o 'Agotado' sin una asignación activa que lo respalde.
--
-- Casos que corrige:
--   1. Tóner con estado 'Asignado' pero SIN asignación activa -> 'Disponible'
--   2. Tóner con estado 'Agotado' y SIN ningún registro en asignacion_toners
--      (la asignación fue eliminada pero no se revirtió el estado) -> 'Disponible'
-- ============================================

-- 1. Tóneres marcados como 'Asignado' pero sin asignación activa
UPDATE bienes
SET estado = 'Disponible'
WHERE tipo_equipo = 'Tóner'
  AND estado = 'Asignado'
  AND id NOT IN (
      SELECT DISTINCT toner_id
      FROM asignacion_toners
      WHERE estado = 'Activo'
  );

-- 2. Tóneres marcados como 'Agotado' pero sin ningún registro de asignación
--    (la asignación fue eliminada pero el UPDATE a 'Disponible' falló)
UPDATE bienes
SET estado = 'Disponible'
WHERE tipo_equipo = 'Tóner'
  AND estado = 'Agotado'
  AND id NOT IN (
      SELECT DISTINCT toner_id
      FROM asignacion_toners
  );

-- 3. Equipos (no tóner) marcados como 'Asignado' pero sin asignación activa
--    (la asignación fue eliminada pero el UPDATE a 'Activo' falló)
UPDATE bienes
SET estado = 'Activo'
WHERE (tipo_equipo IS NULL OR tipo_equipo != 'Tóner')
  AND estado = 'Asignado'
  AND id NOT IN (
      SELECT DISTINCT bien_id
      FROM asignaciones
      WHERE estado_asignacion = 'Activo'
  );
