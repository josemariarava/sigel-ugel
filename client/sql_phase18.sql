-- ============================================
-- FASE 18: Restaurar estado basado en condicion al devolver/eliminar asignaciones
-- ============================================
-- El trigger sync_bienes_estado_equipo ahora consulta bienes.condicion
-- para determinar el estado correcto al devolver o eliminar:
--   condicion = 'Chatarra' → estado = 'Dado de Baja'
--   condicion = 'Malo'     → estado = 'Inactivo'
--   otherwise              → estado = 'Activo'
-- ============================================

CREATE OR REPLACE FUNCTION sync_bienes_estado_equipo()
RETURNS TRIGGER AS $$
DECLARE
    es_toner BOOLEAN;
    bien_condicion TEXT;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.estado_asignacion = 'Activo' THEN
        UPDATE bienes SET estado = 'Asignado' WHERE id = NEW.bien_id;

    ELSIF TG_OP = 'UPDATE' AND OLD.estado_asignacion = 'Activo' THEN
        SELECT COALESCE(tipo_equipo = 'Tóner', false), condicion
        INTO es_toner, bien_condicion
        FROM bienes WHERE id = NEW.bien_id;

        IF NEW.estado_asignacion = 'Devuelto' THEN
            IF es_toner THEN
                UPDATE bienes SET estado = 'Disponible' WHERE id = NEW.bien_id;
            ELSE
                UPDATE bienes SET estado = (
                    CASE
                        WHEN bien_condicion = 'Chatarra' THEN 'Dado de Baja'
                        WHEN bien_condicion = 'Malo' THEN 'Inactivo'
                        ELSE 'Activo'
                    END
                ) WHERE id = NEW.bien_id;
            END IF;
        ELSIF NEW.estado_asignacion = 'Baja' THEN
            UPDATE bienes SET estado = 'Dado de Baja' WHERE id = NEW.bien_id;
        END IF;

    ELSIF TG_OP = 'DELETE' AND OLD.estado_asignacion = 'Activo' THEN
        SELECT COALESCE(tipo_equipo = 'Tóner', false), condicion
        INTO es_toner, bien_condicion
        FROM bienes WHERE id = OLD.bien_id;

        IF es_toner THEN
            UPDATE bienes SET estado = 'Disponible' WHERE id = OLD.bien_id;
        ELSE
            UPDATE bienes SET estado = (
                CASE
                    WHEN bien_condicion = 'Chatarra' THEN 'Dado de Baja'
                    WHEN bien_condicion = 'Malo' THEN 'Inactivo'
                    ELSE 'Activo'
                END
            ) WHERE id = OLD.bien_id;
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
