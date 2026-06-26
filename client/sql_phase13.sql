-- FASE 13: Eliminar campo proveedor (ahora se usa solo razon_social)
ALTER TABLE compras_equipos DROP COLUMN IF EXISTS proveedor;
