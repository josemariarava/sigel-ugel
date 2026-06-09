const http = require('node:http')
const { exec } = require('node:child_process')
const { promisify } = require('node:util')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')

const fsp = fs.promises
const execP = promisify(exec)
const PORT = 5899

const PNP_MAP = {
  ACI: 'Acer', ACR: 'Acer', ACT: 'Acer',
  ADI: 'ADI', AMW: 'AMW',
  AOC: 'AOC', API: 'API', APP: 'Apple', ART: 'Artmedia',
  ASR: 'ASRock',
  AST: 'AST', AUO: 'AU Optronics', AUS: 'Asus',
  BEN: 'BenQ', BMD: 'BMD', BNQ: 'BenQ', BOE: 'BOE',
  CMO: 'Chimei', CMN: 'Chimei', CPL: 'Compal', CPT: 'CPT',
  CTX: 'CTX',
  DEC: 'DEC', DEL: 'Dell', DGC: 'DGC',
  DMO: 'DMO', DTC: 'DTC', DWE: 'Daewoo',
  EIZ: 'Eizo', ELO: 'Elo', ENC: 'ENC', EPI: 'EPI', ESK: 'ESK',
  FUS: 'Fujitsu',
  GBT: 'Gigabyte', GIG: 'Gigabyte',
  GSM: 'LG', GWY: 'Gateway',
  HEC: 'HEC', HIS: 'Hisense', HP: 'HP', HPN: 'HP', HSD: 'Hanns.G',
  HTC: 'HTC', HUA: 'Huawei',
  IBM: 'IBM', ICL: 'Iiyama', IFE: 'InFocus', IFC: 'InFocus',
  INC: 'InnoLux', INS: 'Inseego', INT: 'Intrepid', INV: 'InnoLux',
  IVM: 'Iiyama', IVO: 'IVO',
  JDI: 'JDI', JVC: 'JVC',
  KDC: 'Kodak', KTC: 'KTC',
  LEN: 'Lenovo', LG: 'LG', LGD: 'LG', LPL: 'LG Philips', LTN: 'Lenovo',
  MAG: 'Mag', MAX: 'Maxdata', MEL: 'Meltron', MER: 'Mercado',
  MIR: 'Miro', MIT: 'Mitsubishi', MIZ: 'MiTAC', MMM: 'Mitsubishi',
  MSI: 'MSI', MS_: 'Microsoft', MTC: 'MiTAC',
  NAN: 'Nanao', NEC: 'NEC', NEO: 'Nec', NVD: 'NVIDIA',
  OCL: 'Optoma', OLI: 'Olivetti', ONK: 'Onkyo', OOO: 'OEM', ORI: 'Origin',
  PAN: 'Panasonic', PCC: 'Philips', PHL: 'Philips', PIO: 'Pioneer',
  PLN: 'Planar', PLT: 'Planar', PNC: 'Pioneer', POS: 'Positivo',
  PRO: 'Proview', PTS: 'Prestige',
  REL: 'Relisys',
  SAM: 'Samsung', SAN: 'Samsung', SBI: 'Smartelectronix',
  SCA: 'Samsung', SDC: 'Samsung', SEC: 'Samsung',
  SEG: 'Sege', SEI: 'SEI', SFT: 'Seifert', SGI: 'SGI', SGO: 'SGO',
  SGT: 'SGT', SHG: 'Sharp', SHT: 'Sharp', SII: 'SII',
  SMC: 'Sun', SMI: 'Smartelectronix', SNI: 'Siemens',
  SNY: 'Sony', SON: 'Sony', SOR: 'Sorel', STD: 'STD',
  STN: 'Stone', SUN: 'Sun', SVA: 'SVA', SYM: 'Symbian',
  TAT: 'Tatung', TCL: 'TCL', TDC: 'TDK',
  TOS: 'Toshiba', TSD: 'Toshiba', TST: 'Transtream',
  TVM: 'TVM',
  UNI: 'Unisys', UNK: 'Unknown',
  V7: 'V7', VAI: 'Sony', VEW: 'Vestel',
  VID: 'Videoseven', VII: 'VII', VIZ: 'Vizio',
  VSC: 'ViewSonic', VTK: 'Vitek',
  WAC: 'Wacom', WEC: 'WEC', WES: 'Westinghouse',
  WIN: 'Wintek', WST: 'Westone',
  XCM: 'Xenarc', XIA: 'Xiaomi', XMI: 'Xmind',
  ZCM: 'Zalman', ZTC: 'ZTC'
}

function getMacAddress() {
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (!iface.internal && iface.family === 'IPv4' && iface.mac !== '00:00:00:00:00:00') {
        return iface.mac
      }
    }
  }
  return ''
}

function fieldsDefaults() {
  return ['marca','modelo','numero_serie','procesador','ram','almacenamiento','tipo_almacenamiento','sistema_operativo']
}

function emptyData() {
  const d = {}
  fieldsDefaults().forEach(function(f) { d[f] = '' })
  d.direccion_mac = getMacAddress()
  return d
}

function tempPath(prefix) {
  return path.join(os.tmpdir(), prefix + '_' + crypto.randomBytes(4).toString('hex') + '.ps1')
}

async function detect() {
  const script = '\n' +
'$data = @{}\n' +
'try { $cs = Get-CimInstance Win32_ComputerSystem -ErrorAction Stop; $data.marca = $cs.Manufacturer; $data.modelo = $cs.Model } catch { }\n' +
'try { $b = Get-CimInstance Win32_BIOS -ErrorAction Stop; $s = $b.SerialNumber; if ($s -eq \'System\') { $s = \'\' }; $data.numero_serie = $s } catch { }\n' +
'try { $c = Get-CimInstance Win32_Processor -ErrorAction Stop; $data.procesador = ($c.Name -join \', \') } catch { }\n' +
'try { $r = Get-CimInstance Win32_PhysicalMemory -ErrorAction Stop; $g = [math]::Round(($r | Measure-Object -Property Capacity -Sum).Sum / 1GB, 0); if ($g -gt 0) { $data.ram = ($g.ToString() + \' GB\') } } catch { }\n' +
'try { $d = Get-CimInstance Win32_DiskDrive -ErrorAction Stop; $sg = [math]::Round(($d | ForEach-Object { $_.Size } | Measure-Object -Sum).Sum / 1GB, 0); if ($sg -gt 0) { $data.almacenamiento = ($sg.ToString() + \' GB\') }; $dm = ($d | Select-Object -ExpandProperty Model) -join \' \'; if ($dm -match \'nvme\') { $data.tipo_almacenamiento = \'NVMe\' } elseif ($dm -match \'ssd|solid\') { $data.tipo_almacenamiento = \'SSD\' } else { $data.tipo_almacenamiento = \'HDD\' } } catch { }\n' +
'try { $o = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop; $data.sistema_operativo = ($o.Caption + \' \' + $o.Version).Trim() } catch { }\n' +
'$data | ConvertTo-Json -Compress\n'

  const tempFile = tempPath('detect_info')
  try {
    await fsp.writeFile(tempFile, script, 'utf8')
    const { stdout } = await execP('powershell -ExecutionPolicy Bypass -File "' + tempFile + '"', { timeout: 15000, encoding: 'utf8' })
    let data = {}
    if (stdout && stdout.trim()) {
      try { data = JSON.parse(stdout.trim()) } catch { data = {} }
    }
    fieldsDefaults().forEach(function(f) { data[f] = data[f] || '' })
    data.direccion_mac = getMacAddress()
    return data
  } catch (err) {
    console.error('[detect] Error:', err.message)
    return emptyData()
  } finally {
    try { await fsp.unlink(tempFile) } catch {}
  }
}

async function detectMonitor() {
  let script
  try {
    script = await fsp.readFile(path.join(__dirname, 'detect_monitor.ps1'), 'utf8')
  } catch (err) {
    console.error('[detectMonitor] No se pudo leer detect_monitor.ps1:', err.message)
    return []
  }

  const tempFile = tempPath('detect_monitor')
  try {
    await fsp.writeFile(tempFile, script, 'utf8')
    const { stdout } = await execP('powershell -ExecutionPolicy Bypass -File "' + tempFile + '"', { timeout: 15000, encoding: 'utf8' })
    if (!stdout || stdout.trim() === '__NONE__' || stdout.trim() === '') return []
    const parsed = JSON.parse(stdout.trim())
    if (!Array.isArray(parsed)) return []
    return parsed.map(function(m) {
      const pnpRaw = (m.ManufacturerName || '').trim().toUpperCase()
      const pnp = pnpRaw.slice(0, 3)
      const modelo = (m.ProductName || '').replace(/\0/g, '').trim() || (m.UserFriendlyName || '').replace(/\0/g, '').trim()
      const serie = (m.SerialNumberID || '').replace(/\0/g, '').trim()
      return {
        marca: PNP_MAP[pnp] || PNP_MAP[pnpRaw] || pnpRaw || '',
        modelo: modelo || '',
        serie: (serie && serie.length > 2 && serie !== '0') ? serie : '',
        tamano_pantalla: m.DiagonalInches ? m.DiagonalInches + '"' : ''
      }
    })
  } catch (err) {
    console.error('[detectMonitor] Error:', err.message)
    return []
  } finally {
    try { await fsp.unlink(tempFile) } catch {}
  }
}

const server = http.createServer(function(req, res) {
  const send = function(status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify(body))
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' })
    res.end()
    return
  }

  if (req.url === '/api/info') {
    detect().then(function(data) { send(200, data) }).catch(function(err) { send(500, { error: err.message }) })
  } else if (req.url === '/api/monitor') {
    detectMonitor().then(function(data) {
      if (!data || data.length === 0) { console.error('[detectMonitor] No se detectaron monitores') }
      send(200, data)
    }).catch(function(err) { send(500, { error: err.message }) })
  } else if (req.url === '/api/ping') {
    send(200, { ok: true })
  } else if (req.url === '/api/diagnose') {
    send(200, {
      ping: true,
      pid: process.pid,
      node: process.version,
      usuario: os.userInfo().username,
      hostname: os.hostname(),
      windows: os.version(),
      uptime_segundos: os.uptime()
    })
  } else {
    send(404, { error: 'not found' })
  }
})

server.on('error', function(err) {
  if (err.code === 'EADDRINUSE') {
    console.error('ERROR: El puerto ' + PORT + ' ya está en uso.')
    console.error('Es posible que el agentito ya esté corriendo.')
    console.error('Si no es así, cierra el proceso que ocupa el puerto 5899 e intenta de nuevo.')
    process.exit(1)
  } else {
    console.error('Error al iniciar el servidor:', err.message)
    process.exit(1)
  }
})

server.listen(PORT, function() {
  console.log('Agentito corriendo en http://localhost:' + PORT + '/api/info')
  console.log('  Monitor: http://localhost:' + PORT + '/api/monitor')
  console.log('Presiona Ctrl+C para detener')
})
