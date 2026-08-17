-- ============================================
-- FIX PERMISOS: siguiente_acta para otros usuarios
-- ============================================
-- Síntoma: al crear una asignación nueva (bien o tóner),
-- usuarios con la anon key reciben "permission denied"
-- para correlativos_actas.
-- Causa: la tabla se creó vía SQL Editor (rol postgres)
-- sin GRANTs para authenticated, y la función era
-- SECURITY INVOKER (ejecuta con permisos del llamador).
-- ============================================

-- 1. DIAGNÓSTICO: confirmar que no hay permisos y que
--    la función es invoker (prosecdef = f)
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'correlativos_actas'
ORDER BY grantee;

SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'siguiente_acta';

-- 2. FIX a) Permisos directos sobre la tabla contador
GRANT SELECT, INSERT, UPDATE ON correlativos_actas TO authenticated;

-- 3. FIX b) Recrear la función como SECURITY DEFINER:
--    se ejecuta con permisos del owner (postgres),
--    funciona para cualquier usuario autenticado
CREATE OR REPLACE FUNCTION siguiente_acta(p_anio INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ultimo INTEGER;
BEGIN
    INSERT INTO correlativos_actas (anio, ultimo) VALUES (p_anio, 0)
    ON CONFLICT (anio) DO NOTHING;

    UPDATE correlativos_actas
    SET ultimo = ultimo + 1
    WHERE anio = p_anio
    RETURNING ultimo INTO v_ultimo;

    RETURN v_ultimo;
END;
$$;

-- 4. Asegurar EXECUTE para el rol autenticado
GRANT EXECUTE ON FUNCTION siguiente_acta(integer) TO authenticated;

-- 5. VERIFICACIÓN: ahora debe mostrar los grants y prosecdef = t
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'correlativos_actas'
ORDER BY grantee;

SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'siguiente_acta';
