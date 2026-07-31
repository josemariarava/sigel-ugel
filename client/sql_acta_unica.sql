-- ============================================
-- ACTA ÚNICA: Correlativo compartido para actas
-- de bienes (asignaciones) y tóners (asignacion_toners)
-- ============================================

BEGIN;

-- 1. Tabla contador por año
CREATE TABLE IF NOT EXISTS correlativos_actas (
    anio INTEGER PRIMARY KEY,
    ultimo INTEGER NOT NULL DEFAULT 0
);

-- 2. Función RPC atómica (incremento con lock de fila)
CREATE OR REPLACE FUNCTION siguiente_acta(p_anio INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_ultimo INTEGER;
BEGIN
    INSERT INTO correlativos_actas (anio, ultimo) VALUES (p_anio, 0)
    ON CONFLICT (anio) DO NOTHING;

    UPDATE correlativos_actas
    SET ultimo = ultimo + 1
    WHERE anio = p_anio
    RETURNING ultimo INTO v_ultimo;

    RETURN v_ultimo;
END;
$$;

-- 3. Backfill: sincronizar contador con el máximo de ambas tablas
INSERT INTO correlativos_actas (anio, ultimo)
SELECT
    split_part(numero_acta, '-', 2)::int AS anio,
    MAX(split_part(numero_acta, '-', 1)::int) AS ultimo
FROM (
    SELECT numero_acta FROM asignaciones
    WHERE numero_acta ~ '^[0-9]+-[0-9]{4}$'
    UNION ALL
    SELECT numero_acta FROM asignacion_toners
    WHERE numero_acta ~ '^[0-9]+-[0-9]{4}$'
) todas
GROUP BY split_part(numero_acta, '-', 2)::int
ON CONFLICT (anio) DO UPDATE
SET ultimo = GREATEST(correlativos_actas.ultimo, EXCLUDED.ultimo);

COMMIT;
