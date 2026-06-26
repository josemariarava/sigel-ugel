-- Políticas RLS para todas las tablas principales
-- Siguiendo el mismo patrón de sql_bitacora.sql (acceso público con anon key)

-- personas
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a personas" ON personas;
CREATE POLICY "Acceso público a personas" ON personas
  FOR ALL USING (true) WITH CHECK (true);

-- bienes
ALTER TABLE bienes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a bienes" ON bienes;
CREATE POLICY "Acceso público a bienes" ON bienes
  FOR ALL USING (true) WITH CHECK (true);

-- ambientes
ALTER TABLE ambientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a ambientes" ON ambientes;
CREATE POLICY "Acceso público a ambientes" ON ambientes
  FOR ALL USING (true) WITH CHECK (true);

-- pisos
ALTER TABLE pisos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a pisos" ON pisos;
CREATE POLICY "Acceso público a pisos" ON pisos
  FOR ALL USING (true) WITH CHECK (true);

-- areas
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a areas" ON areas;
CREATE POLICY "Acceso público a areas" ON areas
  FOR ALL USING (true) WITH CHECK (true);

-- asignaciones
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a asignaciones" ON asignaciones;
CREATE POLICY "Acceso público a asignaciones" ON asignaciones
  FOR ALL USING (true) WITH CHECK (true);

-- historial_movimientos
ALTER TABLE historial_movimientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a historial_movimientos" ON historial_movimientos;
CREATE POLICY "Acceso público a historial_movimientos" ON historial_movimientos
  FOR ALL USING (true) WITH CHECK (true);

-- tipos_movimiento
ALTER TABLE tipos_movimiento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a tipos_movimiento" ON tipos_movimiento;
CREATE POLICY "Acceso público a tipos_movimiento" ON tipos_movimiento
  FOR ALL USING (true) WITH CHECK (true);

-- asignacion_toners
ALTER TABLE asignacion_toners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a asignacion_toners" ON asignacion_toners;
CREATE POLICY "Acceso público a asignacion_toners" ON asignacion_toners
  FOR ALL USING (true) WITH CHECK (true);

-- toner_movimientos
ALTER TABLE toner_movimientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a toner_movimientos" ON toner_movimientos;
CREATE POLICY "Acceso público a toner_movimientos" ON toner_movimientos
  FOR ALL USING (true) WITH CHECK (true);

-- compras_toners
ALTER TABLE compras_toners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a compras_toners" ON compras_toners;
CREATE POLICY "Acceso público a compras_toners" ON compras_toners
  FOR ALL USING (true) WITH CHECK (true);

-- compra_detalles
ALTER TABLE compra_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a compra_detalles" ON compra_detalles;
CREATE POLICY "Acceso público a compra_detalles" ON compra_detalles
  FOR ALL USING (true) WITH CHECK (true);

-- marcas
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a marcas" ON marcas;
CREATE POLICY "Acceso público a marcas" ON marcas
  FOR ALL USING (true) WITH CHECK (true);

-- modelos
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a modelos" ON modelos;
CREATE POLICY "Acceso público a modelos" ON modelos
  FOR ALL USING (true) WITH CHECK (true);

-- oficinas (por si aún existe)
ALTER TABLE IF EXISTS oficinas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso público a oficinas" ON oficinas;
CREATE POLICY "Acceso público a oficinas" ON oficinas
  FOR ALL USING (true) WITH CHECK (true);
