import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://apbgcmwnhbagsjfuhnxr.supabase.co',
  'sb_publishable_NcQmwm_YO7HtM-TV5alZ9A__UQbcUqn'
)

async function check() {
  // Check if historial_movimientos table exists
  const { data: hmRows, error: hmErr } = await supabase
    .from('historial_movimientos')
    .select('id, tipo_movimiento_id, bien_id, persona_origen_id, persona_destino_id')
    .limit(5)
  console.log('historial_movimientos sample:')
  if (hmErr) console.log('  Error:', hmErr.message)
  else console.log('  Rows:', JSON.stringify(hmRows, null, 2))

  // Try information_schema for triggers
  const { data: tg, error: tgErr } = await supabase
    .from('information_schema.triggers')
    .select('trigger_name, event_manipulation, event_object_table, action_timing, action_statement')
    .in('event_object_table', ['asignaciones', 'historial_movimientos'])
  console.log('\ntriggers info_schema:')
  if (tgErr) console.log('  Error:', tgErr.message)
  else console.log('  Triggers:', JSON.stringify(tg, null, 2))

  // Check count of historial_movimientos for a specific bien
  const { data: count1 } = await supabase
    .from('historial_movimientos')
    .select('*', { count: 'exact', head: true })
    .limit(0)
  console.log(`\ntotal historial_movimientos:`, count1)

  // Check for duplicate entries (same bien_id AND same fecha AND same persona)
  const { data: dupes } = await supabase
    .from('historial_movimientos')
    .select('bien_id, fecha_movimiento, count')
    .order('bien_id')
    .limit(10)

  process.exit(0)
}

check().catch(e => { console.error(e); process.exit(1) })
