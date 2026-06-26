-- ============================================
-- FASE 9: Fortalecer integridad referencial y atómica
-- ============================================
-- Objetivos:
--   1. Agregar FOREIGN KEYs faltantes para evitar referencias inválidas
--   2. Índices únicos parciales para evitar doble asignación activa
--   3. Triggers que sincronizan bienes.estado automáticamente (transacción atómica)
-- ============================================

-- 1. Limpiar posibles huérfanos antes de agregar FKs
UPDATE asignaciones SET bien_id = NULL WHERE bien_id IS NOT NULL AND bien_id NOT IN (SELECT id FROM bienes);
UPDATE asignaciones SET persona_id = NULL WHERE persona_id IS NOT NULL AND persona_id NOT IN (SELECT id FROM personas);
UPDATE asignaciones SET ambiente_id = NULL WHERE ambiente_id IS NOT NULL AND ambiente_id NOT IN (SELECT id FROM ambientes);
UPDATE historial_movimientos SET bien_id = NULL WHERE bien_id IS NOT NULL AND bien_id NOT IN (SELECT id FROM bienes);

-- 2. Foreign keys para asignaciones
ALTER TABLE asignaciones
    ADD CONSTRAINT fk_asignaciones_bien
    FOREIGN KEY (bien_id) REFERENCES bienes(id) ON DELETE SET NULL;

ALTER TABLE asignaciones
    ADD CONSTRAINT fk_asignaciones_persona
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL;

ALTER TABLE asignaciones
    ADD CONSTRAINT fk_asignaciones_ambiente
    FOREIGN KEY (ambiente_id) REFERENCES ambientes(id) ON DELETE SET NULL;

-- 3. Foreign key para historial_movimientos
ALTER TABLE historial_movimientos
    ADD CONSTRAINT fk_historial_movimientos_bien
    FOREIGN KEY (bien_id) REFERENCES bienes(id) ON DELETE SET NULL;

-- 4. Índices únicos parciales para evitar doble asignación activa
CREATE UNIQUE INDEX IF NOT EXISTS idx_asignaciones_activa_unique
    ON asignaciones (bien_id)
    WHERE estado_asignacion = 'Activo';

CREATE UNIQUE INDEX IF NOT EXISTS idx_asignacion_toners_activa_unique
    ON asignacion_toners (toner_id)
    WHERE estado = 'Activo';

-- 5. Trigger: sincronizar bienes.estado desde asignacion_toners
--    Se ejecuta en la misma transacción, asegurando atomicidad.
CREATE OR REPLACE FUNCTION sync_bienes_estado_toner()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.estado = 'Activo' THEN
        UPDATE bienes SET estado = 'Asignado' WHERE id = NEW.toner_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.estado = 'Activo' AND NEW.estado = 'Terminado' THEN
        UPDATE bienes SET estado = 'Agotado' WHERE id = NEW.toner_id;
    ELSIF TG_OP = 'DELETE' AND OLD.estado = 'Activo' THEN
        UPDATE bienes SET estado = 'Disponible' WHERE id = OLD.toner_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_bienes_estado_toner ON asignacion_toners;
CREATE TRIGGER trg_sync_bienes_estado_toner
    AFTER INSERT OR UPDATE OR DELETE ON asignacion_toners
    FOR EACH ROW
    EXECUTE FUNCTION sync_bienes_estado_toner();

-- 6. Trigger: sincronizar bienes.estado desde asignaciones
--    'Trasladado' no cambia bienes.estado porque el bien sigue asignado.
CREATE OR REPLACE FUNCTION sync_bienes_estado_equipo()
RETURNS TRIGGER AS $$
DECLARE
    es_toner BOOLEAN;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.estado_asignacion = 'Activo' THEN
        UPDATE bienes SET estado = 'Asignado' WHERE id = NEW.bien_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.estado_asignacion = 'Activo' THEN
        SELECT COALESCE(tipo_equipo = 'Tóner', false) INTO es_toner FROM bienes WHERE id = NEW.bien_id;
        IF NEW.estado_asignacion = 'Devuelto' THEN
            IF es_toner THEN
                UPDATE bienes SET estado = 'Disponible' WHERE id = NEW.bien_id;
            ELSE
                UPDATE bienes SET estado = 'Activo' WHERE id = NEW.bien_id;
            END IF;
        ELSIF NEW.estado_asignacion = 'Baja' THEN
            UPDATE bienes SET estado = 'Dado de Baja' WHERE id = NEW.bien_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.estado_asignacion = 'Activo' THEN
        SELECT COALESCE(tipo_equipo = 'Tóner', false) INTO es_toner FROM bienes WHERE id = OLD.bien_id;
        IF es_toner THEN
            UPDATE bienes SET estado = 'Disponible' WHERE id = OLD.bien_id;
        ELSE
            UPDATE bienes SET estado = 'Activo' WHERE id = OLD.bien_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_bienes_estado_equipo ON asignaciones;
CREATE TRIGGER trg_sync_bienes_estado_equipo
    AFTER INSERT OR UPDATE OR DELETE ON asignaciones
    FOR EACH ROW
    EXECUTE FUNCTION sync_bienes_estado_equipo();
