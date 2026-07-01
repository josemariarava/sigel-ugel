-- v4: Agregar columnas para registro unificado de actividades
-- publicacion: url_publicacion, seccion_publicacion, fecha_publicacion, fecha_expiracion, requiere_aprobacion
-- correo: cuenta_creada, fecha_activacion
-- contrasena: usuario_restablecido, fecha_restablecimiento, entregada_por

ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS url_publicacion TEXT;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS cuenta_creada VARCHAR(100);
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS usuario_restablecido VARCHAR(100);
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS seccion_publicacion VARCHAR(50);
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS fecha_expiracion DATE;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS fecha_publicacion DATE;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS fecha_activacion DATE;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS fecha_restablecimiento DATE;
ALTER TABLE bitacora ADD COLUMN IF NOT EXISTS entregada_por VARCHAR(50);
