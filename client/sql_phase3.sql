-- ============================================
-- FASE 3: Políticas de Storage para bucket actas
-- ============================================

-- Permitir INSERT (subir) para anónimos en el bucket actas
CREATE POLICY "actas_insert_anon"
    ON storage.objects
    FOR INSERT
    TO anon
    WITH CHECK (bucket_id = 'actas');

-- Permitir SELECT (ver) para anónimos en el bucket actas
CREATE POLICY "actas_select_anon"
    ON storage.objects
    FOR SELECT
    TO anon
    USING (bucket_id = 'actas');

-- Permitir UPDATE (sobrescribir) para anónimos en el bucket actas
CREATE POLICY "actas_update_anon"
    ON storage.objects
    FOR UPDATE
    TO anon
    USING (bucket_id = 'actas')
    WITH CHECK (bucket_id = 'actas');
