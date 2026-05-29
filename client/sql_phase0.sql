-- ============================================
-- FASE 0: Creación de tablas nuevas (sin breaking changes)
-- ============================================

-- 1. Catálogo de marcas
CREATE TABLE IF NOT EXISTS marcas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Catálogo de modelos (por marca)
CREATE TABLE IF NOT EXISTS modelos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marca_id UUID NOT NULL REFERENCES marcas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(marca_id, nombre)
);

-- 3. Compras / Órdenes de Compra (cabecera)
CREATE TABLE IF NOT EXISTS compras_toners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_compra VARCHAR(100) NOT NULL,
    proveedor VARCHAR(200),
    fecha_compra DATE DEFAULT CURRENT_DATE,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Detalle de cada línea dentro de una compra
CREATE TABLE IF NOT EXISTS compra_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras_toners(id) ON DELETE CASCADE,
    marca_id UUID REFERENCES marcas(id) ON DELETE SET NULL,
    modelo_id UUID REFERENCES modelos(id) ON DELETE SET NULL,
    marca VARCHAR(100),  -- texto libre por si la marca no está en catálogo
    modelo VARCHAR(100),  -- texto libre por si el modelo no está en catálogo
    color_toner VARCHAR(50),
    cantidad_pedida INTEGER NOT NULL,
    cantidad_recibida INTEGER NOT NULL DEFAULT 0,
    costo_unitario DECIMAL(10, 2),
    lote VARCHAR(100),
    rendimiento INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Nuevas columnas en bienes (TODAS nullable, sin afectar datos existentes)
ALTER TABLE bienes 
    ADD COLUMN IF NOT EXISTS compra_detalle_id UUID REFERENCES compra_detalles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS ubicacion_almacen VARCHAR(100),
    ADD COLUMN IF NOT EXISTS marca_id UUID REFERENCES marcas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS modelo_id UUID REFERENCES modelos(id) ON DELETE SET NULL;
