-- Eliminar FK duplicados en asignaciones (creados automáticamente al crear la tabla
-- en el Dashboard, y luego duplicados por sql_phase9.sql al añadir nombres explícitos)

-- 1. bien_id: eliminar el auto-named, conservar fk_asignaciones_bien
ALTER TABLE asignaciones DROP CONSTRAINT IF EXISTS asignaciones_bien_id_fkey;

-- 2. persona_id: eliminar el auto-named, conservar fk_asignaciones_persona
ALTER TABLE asignaciones DROP CONSTRAINT IF EXISTS asignaciones_persona_id_fkey;

-- 3. ambiente_id: eliminar el auto-named, conservar fk_asignaciones_ambiente
ALTER TABLE asignaciones DROP CONSTRAINT IF EXISTS asignaciones_ambiente_id_fkey;
