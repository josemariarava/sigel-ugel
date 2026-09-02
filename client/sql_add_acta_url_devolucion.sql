-- Agregar columna para almacenar URL del acta de devolución
ALTER TABLE asignaciones ADD COLUMN IF NOT EXISTS acta_url_devolucion TEXT;
