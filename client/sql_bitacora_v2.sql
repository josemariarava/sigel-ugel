-- ============================================
-- FASE: Ticket + Trazabilidad + Tiempo
-- numero_ticket, bitacora_log, updated_at/by
-- ============================================

-- 1. Columnas nuevas en bitacora
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS numero_ticket TEXT UNIQUE;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS updated_by TEXT;

CREATE INDEX IF NOT EXISTS idx_bitacora_numero_ticket ON bitacora(numero_ticket);

-- 2. Tabla de auditoría
CREATE TABLE IF NOT EXISTS bitacora_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bitacora_id UUID NOT NULL REFERENCES bitacora(id) ON DELETE CASCADE,
  tipo_cambio TEXT NOT NULL,
  estado_anterior TEXT,
  estado_nuevo TEXT,
  usuario TEXT NOT NULL,
  detalle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bitacora_log_bitacora_id ON bitacora_log(bitacora_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_log_created_at ON bitacora_log(created_at DESC);

-- 3. Backfill registros existentes (CTE con row_number)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM bitacora
  WHERE numero_ticket IS NULL
)
UPDATE bitacora b SET
  numero_ticket = 'TKT-' || TO_CHAR(b.created_at, 'YYYY') || '-' || LPAD(n.rn::TEXT, 4, '0'),
  updated_at = b.created_at,
  updated_by = b.atendido_por
FROM numbered n
WHERE b.id = n.id;
