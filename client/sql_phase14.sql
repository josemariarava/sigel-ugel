-- FASE 14: Unique constraint en serie para bienes y compras_equipos_detalles
-- ⚠️ ANTES de ejecutar, verifica que no existan series duplicadas:
--   SELECT serie, COUNT(*) FROM bienes GROUP BY serie HAVING COUNT(*) > 1;
--   SELECT serie, COUNT(*) FROM compras_equipos_detalles GROUP BY serie HAVING COUNT(*) > 1;

ALTER TABLE bienes ADD CONSTRAINT bienes_serie_key UNIQUE (serie);
ALTER TABLE compras_equipos_detalles ADD CONSTRAINT compras_equipos_detalles_serie_key UNIQUE (serie);
