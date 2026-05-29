-- ============================================
-- FASE 5: Sincronizar bienes.estado para equipos (no tóners)
-- + Columna numero_acta para asignaciones
-- ============================================

-- 0. Agregar columna numero_acta a asignaciones
ALTER TABLE asignaciones ADD COLUMN IF NOT EXISTS numero_acta TEXT;

-- Backfill: asignar numero_acta a registros existentes que no tengan
WITH numbered AS (
    SELECT id, fecha_asignacion,
           ROW_NUMBER() OVER (ORDER BY fecha_asignacion, id) as rn
    FROM asignaciones
    WHERE numero_acta IS NULL
)
UPDATE asignaciones a
SET numero_acta = CONCAT(
    LPAD(CAST(n.rn AS TEXT), 4, '0'),
    '-',
    EXTRACT(YEAR FROM a.fecha_asignacion)::TEXT
)
FROM numbered n
WHERE a.id = n.id;

-- 1. Equipos con estado 'Activo' que tienen asignación activa -> 'Asignado'
UPDATE bienes
SET estado = 'Asignado'
WHERE (tipo_equipo IS NULL OR tipo_equipo != 'Tóner')
  AND estado = 'Activo'
  AND id IN (
      SELECT DISTINCT bien_id FROM asignaciones WHERE estado_asignacion = 'Activo'
  );

-- 2. Equipos con estado 'Asignado' pero SIN asignación activa -> 'Activo'
UPDATE bienes
SET estado = 'Activo'
WHERE (tipo_equipo IS NULL OR tipo_equipo != 'Tóner')
  AND estado = 'Asignado'
  AND id NOT IN (
      SELECT DISTINCT bien_id FROM asignaciones WHERE estado_asignacion = 'Activo'
  );

-- 3. Equipos con estado 'Asignado' cuya última asignación fue 'Baja' -> 'Dado de Baja'
UPDATE bienes
SET estado = 'Dado de Baja'
WHERE (tipo_equipo IS NULL OR tipo_equipo != 'Tóner')
  AND estado = 'Asignado'
  AND id IN (
      SELECT DISTINCT a1.bien_id
      FROM asignaciones a1
      INNER JOIN (
          SELECT bien_id, MAX(fecha_asignacion) as max_fecha
          FROM asignaciones
          GROUP BY bien_id
      ) a2 ON a1.bien_id = a2.bien_id AND a1.fecha_asignacion = a2.max_fecha
      WHERE a1.estado_asignacion = 'Baja'
  );
