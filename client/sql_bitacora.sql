-- Tabla para el módulo de Bitácora (Atenciones de Soporte Técnico)
CREATE TABLE IF NOT EXISTS bitacora (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
  ambiente_id UUID REFERENCES ambientes(id) ON DELETE SET NULL,
  tipo_problema TEXT NOT NULL,
  tipo_atencion TEXT NOT NULL DEFAULT 'Presencial',
  descripcion TEXT,
  solucion TEXT,
  prioridad TEXT NOT NULL DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta')),
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En proceso', 'Resuelto', 'Cerrado')),
  fecha_atencion DATE DEFAULT CURRENT_DATE,
  fecha_cierre DATE,
  requiere_seguimiento BOOLEAN DEFAULT FALSE,
  atendido_por TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_bitacora_estado ON bitacora(estado);
CREATE INDEX IF NOT EXISTS idx_bitacora_persona ON bitacora(persona_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora(fecha_atencion DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_prioridad ON bitacora(prioridad);

-- Políticas RLS (acceso público para usuarios autenticados)
ALTER TABLE bitacora ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso público a bitacora" ON bitacora;
CREATE POLICY "Acceso público a bitacora" ON bitacora
  FOR ALL USING (true) WITH CHECK (true);
