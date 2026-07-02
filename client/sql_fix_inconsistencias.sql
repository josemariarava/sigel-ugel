-- Fix inconsistencias identificadas en el análisis:
-- #1: Agregar columna fecha_vencimiento a compra_detalles
-- #9: UNIQUE constraint en orden_compra de compras_toners y compras_equipos

-- #1
ALTER TABLE compra_detalles ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

-- #9
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'compras_toners_orden_compra_key'
          AND conrelid = 'compras_toners'::regclass
    ) THEN
        ALTER TABLE compras_toners ADD CONSTRAINT compras_toners_orden_compra_key UNIQUE (orden_compra);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'compras_equipos_orden_compra_key'
          AND conrelid = 'compras_equipos'::regclass
    ) THEN
        ALTER TABLE compras_equipos ADD CONSTRAINT compras_equipos_orden_compra_key UNIQUE (orden_compra);
    END IF;
END $$;
