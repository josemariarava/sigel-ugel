-- ============================================
-- FASE 19: Agregar Contenedor de Tóner (Residuo) como tipo toner
-- ============================================
-- Este script actualiza los triggers y queries para que el nuevo
-- tipo 'Contenedor de Tóner (Residuo)' sea tratado como un toner
-- en los triggers de sincronización de estado.

-- 1. Actualizar trigger de sincronización en asignaciones (phase9/phase18)
CREATE OR REPLACE FUNCTION sync_bienes_estado_equipo()
RETURNS TRIGGER AS $$
DECLARE
    es_toner BOOLEAN;
    bien_condicion TEXT;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.estado_asignacion = 'Activo' THEN
        UPDATE bienes SET estado = 'Asignado' WHERE id = NEW.bien_id;

    ELSIF TG_OP = 'UPDATE' AND OLD.estado_asignacion = 'Activo' THEN
        SELECT COALESCE(tipo_equipo IN ('Tóner', 'Contenedor de Tóner (Residuo)'), false), condicion
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
        SELECT COALESCE(tipo_equipo IN ('Tóner', 'Contenedor de Tóner (Residuo)'), false), condicion
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
