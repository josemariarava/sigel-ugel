-- ============================================================
-- v3: Agregar tipo_actividad para el Registro de Actividades
-- ============================================================

ALTER TABLE bitacora
  ADD COLUMN IF NOT EXISTS tipo_actividad VARCHAR(30)
  NOT NULL DEFAULT 'incidencia';

-- Actualizar registros existentes sin tipo_actividad a 'incidencia'
UPDATE bitacora SET tipo_actividad = 'incidencia' WHERE tipo_actividad IS NULL;
