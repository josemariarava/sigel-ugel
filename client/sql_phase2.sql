-- ============================================
-- FASE 2: Trazabilidad — movimientos + acta_url
-- ============================================

-- 1. Almacenar URL del acta PDF en cada asignación
ALTER TABLE asignacion_toners
    ADD COLUMN IF NOT EXISTS acta_url TEXT;

-- 2. Bitácora de movimientos del tóner
CREATE TABLE IF NOT EXISTS toner_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toner_id UUID NOT NULL REFERENCES bienes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,  -- 'asignacion', 'terminado', 'traslado', 'recepcion'
    descripcion TEXT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas rápidas por tóner
CREATE INDEX IF NOT EXISTS idx_toner_movimientos_toner_id ON toner_movimientos(toner_id);
CREATE INDEX IF NOT EXISTS idx_toner_movimientos_fecha ON toner_movimientos(fecha);
