-- Fase 15: Agregar estado "Inactivo" para bienes no tóner
ALTER TABLE bienes DROP CONSTRAINT bienes_estado_check;
ALTER TABLE bienes ADD CONSTRAINT bienes_estado_check 
  CHECK (estado IN ('Activo', 'Inactivo', 'Dado de Baja', 'Disponible', 'Asignado', 'Agotado'));
