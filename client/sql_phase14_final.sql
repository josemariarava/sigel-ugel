-- FASE 14: Limpieza de duplicados + UNIQUE constraint en serie
-- Ejecutar TODO en una sola transacción

BEGIN;

-- 1. Placeholders genéricos → NULL (no tienen valor real)
UPDATE bienes SET serie = NULL WHERE serie IN ('Default string', 'SN');

-- 2. Series duplicadas reales (O-C-20-2026-XXX): mantener la primera fila,
--    al resto agregarle -{id} como sufijo para hacerlas únicas
UPDATE bienes
SET serie = CONCAT(serie, '-', id)
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY serie ORDER BY id) AS rn
        FROM bienes
        WHERE serie IN (
            SELECT serie FROM bienes
            WHERE serie IS NOT NULL
            GROUP BY serie
            HAVING COUNT(*) > 1
        )
    ) dups
    WHERE rn > 1
);

-- 3. Verificar que ya no hay duplicados (debe devolver 0 filas)
SELECT serie, COUNT(*) FROM bienes WHERE serie IS NOT NULL GROUP BY serie HAVING COUNT(*) > 1;

-- 4. Revisar compras_equipos_detalles
SELECT serie, COUNT(*) FROM compras_equipos_detalles WHERE serie IS NOT NULL GROUP BY serie HAVING COUNT(*) > 1;

-- 5. Si el paso 4 devuelve filas, también hay que limpiar compras_equipos_detalles.
--    Descomenta y ejecuta si es necesario:
-- UPDATE compras_equipos_detalles SET serie = NULL WHERE serie IN ('Default string', 'SN');
-- UPDATE compras_equipos_detalles
-- SET serie = CONCAT(serie, '-', id)
-- WHERE id IN (
--     SELECT id FROM (
--         SELECT id, ROW_NUMBER() OVER (PARTITION BY serie ORDER BY id) AS rn
--         FROM compras_equipos_detalles
--         WHERE serie IN (
--             SELECT serie FROM compras_equipos_detalles
--             WHERE serie IS NOT NULL
--             GROUP BY serie
--             HAVING COUNT(*) > 1
--         )
--     ) dups
--     WHERE rn > 1
-- );

-- 6. Aplicar UNIQUE constraints
ALTER TABLE bienes ADD CONSTRAINT bienes_serie_key UNIQUE (serie);
ALTER TABLE compras_equipos_detalles ADD CONSTRAINT compras_equipos_detalles_serie_key UNIQUE (serie);

COMMIT;
