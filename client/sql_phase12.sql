-- FASE 12: Campos fiscales para compras_equipos (RUC, razón social, dirección, mes calendario)
ALTER TABLE compras_equipos ADD COLUMN IF NOT EXISTS razon_social VARCHAR(300);
ALTER TABLE compras_equipos ADD COLUMN IF NOT EXISTS ruc VARCHAR(11);
ALTER TABLE compras_equipos ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE compras_equipos ADD COLUMN IF NOT EXISTS mes_calendario VARCHAR(50);

ALTER TABLE compras_equipos_detalles ADD COLUMN IF NOT EXISTS cantidad_pedida INTEGER NOT NULL DEFAULT 1;
