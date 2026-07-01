# Sesión 2026-07-01 — Paso 4 dinámico + persistencia real de campos extra

## Resumen
Paso 4 (Control) ahora es dinámico por tipo_actividad, mostrando solo los campos relevantes.
Campos extra (`url_publicacion`, `cuenta_creada`, etc.) ahora se persisten en Supabase.

## Cambios realizados

### sql_bitacora_v4.sql (🆕)
- 10 columnas nuevas: `url_publicacion`, `cuenta_creada`, `usuario_restablecido`,
  `seccion_publicacion`, `fecha_expiracion`, `requiere_aprobacion`, `fecha_publicacion`,
  `fecha_activacion`, `fecha_restablecimiento`, `entregada_por`

### useBitacora.jsx
- `emptyForm` — 10 campos nuevos agregados
- `abrirDrawer` (edit) — pobla los 10 campos nuevos desde la BD
- `handleSubmit` — envía los campos nuevos en INSERT y UPDATE

### DrawerBitacora.jsx — Paso 4 (Control) dinámico

| tipo_actividad | Campos en Control |
|---|---|
| `incidencia` | Prioridad + Tipo atención + Fecha atención (igual) |
| `publicacion` | Sección (Select: Convocatorias/Comunicados/Documentos/Normativas/Otro) + Fecha publicación + Fecha expiración (opt) + Requiere aprobación (Checkbox) |
| `correo` | Fecha de activación |
| `contrasena` | Fecha restablecimiento + Entregada por (Select: Presencial/Teléfono/Correo) |
| `otra` | Prioridad + Fecha |

### DrawerBitacora.jsx — Edit mode
- Edit mode ahora muestra campos según `tipo_actividad` (layout página única condicional)
- Estado incluye `Completado`

### DrawerDetalleBitacora.jsx
- Cards "Detalles" y "Control" ahora son dinámicas por tipo_actividad
- Muestra los campos específicos de cada tipo
- `ESTADO_ICON`/`ESTADO_COLOR` incluye `Completado`
- Publicación: muestra `descripcion` como "Título:"

### DrawerBitacora.jsx — Step 3 (Detalles) mejorado
- `incidencia`: tipo_problema grid + Descripción textarea (requerido)
- `publicacion`: Título de la publicación `<Input>` (requerido) + URL (opcional) — sin textarea descripción
- `correo`: Cuenta creada + Descripción (opcional, sin `*`)
- `contrasena`: Usuario + Descripción (opcional, sin `*`)
- `otra`: Descripción textarea (requerido)
- Checkbox "Requiere seguimiento" solo para incidencia
- `validateStep(3)` actualizada por tipo

## Pendientes
- Ejecutar `sql_bitacora_v4.sql` en producción (después de v3)
- Validar flujo completo en QA

## Comandos útiles
```bash
cd client
npm run dev      # desarrollo
npm run build    # build producción
```
