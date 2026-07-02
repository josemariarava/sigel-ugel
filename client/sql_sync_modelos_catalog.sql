-- Sincronización one-time: crea registros faltantes en marcas/modelos
-- a partir de texto libre en bienes (marca / modelo) que no tienen FK.
--
-- Ejecutar en SQL Editor de Supabase.
-- Uso: copiar, pegar, seleccionar todo y ejecutar.

DO $$
DECLARE
    b RECORD;
    v_marca_id UUID;
    v_modelo_id UUID;
    v_count_marcas INT := 0;
    v_count_modelos INT := 0;
    v_count_bienes INT := 0;
BEGIN
    FOR b IN
        SELECT id, marca, modelo, marca_id, modelo_id
        FROM bienes
        WHERE (marca IS NOT NULL AND marca_id IS NULL)
           OR (modelo IS NOT NULL AND modelo_id IS NULL)
        ORDER BY id
    LOOP
        v_marca_id := b.marca_id;
        v_modelo_id := b.modelo_id;

        -- === MARCA ===
        IF b.marca IS NOT NULL AND v_marca_id IS NULL THEN
            SELECT id INTO v_marca_id
            FROM marcas
            WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(b.marca))
            LIMIT 1;

            IF v_marca_id IS NULL THEN
                INSERT INTO marcas (nombre)
                VALUES (TRIM(b.marca))
                ON CONFLICT (nombre) DO NOTHING
                RETURNING id INTO v_marca_id;

                IF v_marca_id IS NULL THEN
                    SELECT id INTO v_marca_id
                    FROM marcas
                    WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(b.marca))
                    LIMIT 1;
                END IF;

                IF v_marca_id IS NOT NULL THEN
                    v_count_marcas := v_count_marcas + 1;
                END IF;
            END IF;

            IF v_marca_id IS NOT NULL THEN
                UPDATE bienes SET marca_id = v_marca_id WHERE id = b.id;
            END IF;
        END IF;

        -- === MODELO ===
        IF b.modelo IS NOT NULL AND v_modelo_id IS NULL AND v_marca_id IS NOT NULL THEN
            SELECT id INTO v_modelo_id
            FROM modelos
            WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(b.modelo))
              AND marca_id = v_marca_id
            LIMIT 1;

            IF v_modelo_id IS NULL THEN
                INSERT INTO modelos (nombre, marca_id)
                VALUES (TRIM(b.modelo), v_marca_id)
                ON CONFLICT (marca_id, nombre) DO NOTHING
                RETURNING id INTO v_modelo_id;

                IF v_modelo_id IS NULL THEN
                    SELECT id INTO v_modelo_id
                    FROM modelos
                    WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(b.modelo))
                      AND marca_id = v_marca_id
                    LIMIT 1;
                END IF;

                IF v_modelo_id IS NOT NULL THEN
                    v_count_modelos := v_count_modelos + 1;
                END IF;
            END IF;

            IF v_modelo_id IS NOT NULL THEN
                UPDATE bienes SET modelo_id = v_modelo_id WHERE id = b.id;
                v_count_bienes := v_count_bienes + 1;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE '✅ Sincronización: % marcas creadas, % modelos creados, % bienes actualizados',
        v_count_marcas, v_count_modelos, v_count_bienes;
END $$;
