-- =============================================================
-- UNIQUE constraint en bienes.serie
-- Fecha: 2026-07-03
-- Contexto: Se detectaron 10 series duplicadas (O-C-20-2026-XXX)
--   en la tabla bienes, todas de la OC O/C 20-2026.
--   Los duplicados se limpiaron vía script Node.js:
--   a los registros sobrantes se les agregó un sufijo -{uuid8}.
--   Total registros corregidos: 26.
--   Además se corrigió handleRegistrarCompra para que use un
--   contador global entre detalles al auto-generar series.
-- =============================================================

ALTER TABLE bienes ADD CONSTRAINT bienes_serie_key UNIQUE (serie);

-- Opcional: también aplica a compras_equipos_detalles
-- (no tenía duplicados al momento de escribir esto)
-- ALTER TABLE compras_equipos_detalles ADD CONSTRAINT compras_equipos_detalles_serie_key UNIQUE (serie);
