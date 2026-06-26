-- Agregar campos a compras_equipos para datos fiscales y de orden de compra
ALTER TABLE compras_equipos
    ADD COLUMN IF NOT EXISTS razon_social VARCHAR(250),
    ADD COLUMN IF NOT EXISTS ruc VARCHAR(11),
    ADD COLUMN IF NOT EXISTS direccion TEXT,
    ADD COLUMN IF NOT EXISTS mes_calendario VARCHAR(20);

-- Actualizar compras_equipos_detalles con cantidad_pedida para tracking
ALTER TABLE compras_equipos_detalles
    ADD COLUMN IF NOT EXISTS cantidad_pedida INTEGER NOT NULL DEFAULT 1;
