-- FASE 11: Compras de Equipos (CPU, Monitores, Impresoras, etc.)
-- Tablas paralelas a compras_toners/compra_detalles pero para equipos generales

CREATE TABLE IF NOT EXISTS compras_equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_compra VARCHAR(100) NOT NULL,
    proveedor VARCHAR(200),
    fecha_compra DATE DEFAULT CURRENT_DATE,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compras_equipos_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras_equipos(id) ON DELETE CASCADE,
    tipo_equipo VARCHAR(50) NOT NULL,
    marca_id UUID REFERENCES marcas(id) ON DELETE SET NULL,
    modelo_id UUID REFERENCES modelos(id) ON DELETE SET NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    serie VARCHAR(200) NOT NULL,
    codigo_patrimonial VARCHAR(100),
    cantidad_recibida INTEGER NOT NULL DEFAULT 1,
    costo_unitario DECIMAL(10,2),
    procesador VARCHAR(100),
    ram VARCHAR(100),
    almacenamiento VARCHAR(100),
    tipo_almacenamiento VARCHAR(50),
    sistema_operativo VARCHAR(100),
    tamano_pantalla VARCHAR(50),
    direccion_mac VARCHAR(50),
    color VARCHAR(50),
    condicion VARCHAR(20) DEFAULT 'Bueno',
    other TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE bienes ADD COLUMN IF NOT EXISTS compra_equipo_detalle_id UUID REFERENCES compras_equipos_detalles(id) ON DELETE SET NULL;

-- RLS policies
ALTER TABLE compras_equipos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a compras_equipos" ON compras_equipos;
CREATE POLICY "Acceso público a compras_equipos" ON compras_equipos
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE compras_equipos_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a compras_equipos_detalles" ON compras_equipos_detalles;
CREATE POLICY "Acceso público a compras_equipos_detalles" ON compras_equipos_detalles
    FOR ALL USING (true) WITH CHECK (true);
