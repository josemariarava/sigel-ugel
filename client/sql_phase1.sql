-- ============================================
-- FASE 1: Agregar entregado_por + FK faltantes
-- ============================================

-- 1. Columna entregado_por (idempotente)
ALTER TABLE asignacion_toners 
    ADD COLUMN IF NOT EXISTS entregado_por UUID REFERENCES personas(id) ON DELETE SET NULL;

-- 2. FK constraints faltantes (usa pg_constraint para evitar duplicados)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asignacion_toners_toner_id_fkey') THEN
        ALTER TABLE asignacion_toners ADD CONSTRAINT asignacion_toners_toner_id_fkey
            FOREIGN KEY (toner_id) REFERENCES bienes(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asignacion_toners_impresora_id_fkey') THEN
        ALTER TABLE asignacion_toners ADD CONSTRAINT asignacion_toners_impresora_id_fkey
            FOREIGN KEY (impresora_id) REFERENCES bienes(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asignacion_toners_persona_id_fkey') THEN
        ALTER TABLE asignacion_toners ADD CONSTRAINT asignacion_toners_persona_id_fkey
            FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asignacion_toners_oficina_id_fkey') THEN
        ALTER TABLE asignacion_toners ADD CONSTRAINT asignacion_toners_oficina_id_fkey
            FOREIGN KEY (oficina_id) REFERENCES oficinas(id) ON DELETE SET NULL;
    END IF;
END $$;
