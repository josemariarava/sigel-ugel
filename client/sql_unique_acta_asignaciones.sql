-- Agregar UNIQUE constraint a numero_acta en asignaciones
-- (mismo patrón que asignacion_toners en sql_phase19.sql)

ALTER TABLE asignaciones ADD CONSTRAINT asignaciones_numero_acta_unique UNIQUE (numero_acta);
