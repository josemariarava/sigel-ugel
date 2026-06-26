/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 421:
/***/ ((module) => {

"use strict";
module.exports = require("node:child_process");

/***/ }),

/***/ 598:
/***/ ((module) => {

"use strict";
module.exports = require("node:crypto");

/***/ }),

/***/ 24:
/***/ ((module) => {

"use strict";
module.exports = require("node:fs");

/***/ }),

/***/ 67:
/***/ ((module) => {

"use strict";
module.exports = require("node:http");

/***/ }),

/***/ 161:
/***/ ((module) => {

"use strict";
module.exports = require("node:os");

/***/ }),

/***/ 760:
/***/ ((module) => {

"use strict";
module.exports = require("node:path");

/***/ }),

/***/ 975:
/***/ ((module) => {

"use strict";
module.exports = require("node:util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const http = __nccwpck_require__(67)
const { exec } = __nccwpck_require__(421)
const { promisify } = __nccwpck_require__(975)
const fs = __nccwpck_require__(24)
const path = __nccwpck_require__(760)
const os = __nccwpck_require__(161)
const crypto = __nccwpck_require__(598)

const fsp = fs.promises
const execP = promisify(exec)
const PORT = 5899

function ts() {
  const d = new Date()
  return d.toLocaleTimeString('es-PE', { hour12: false })
}

function log(level, tag, msg, extra) {
  const line = '[' + ts() + '] [' + level + '] [' + tag + '] ' + msg + (extra ? ' ' + extra : '')
  console.log(line)
}

async function psExec(script, label) {
  const encoded = Buffer.from(script, 'utf16le').toString('base64')
  const scriptLen = encoded.length
  log('INFO', 'psExec', 'Trying -EncodedCommand (' + scriptLen + ' chars) ' + (label || ''))
  try {
    const { stdout } = await execP('powershell -ExecutionPolicy Bypass -EncodedCommand ' + encoded, { timeout: 30000, encoding: 'utf8' })
    log('OK', 'psExec', '-EncodedCommand succeeded ' + (label || ''))
    return { stdout }
  } catch (err) {
    let tooLong = false
    let isTimeout = err.killed === true
    const stderrMsg = (err.stderr || err.message || '').toLowerCase()
    if (stderrMsg.includes('demasiado larga') || stderrMsg.includes('too long') || stderrMsg.includes('command line') || stderrMsg.includes('command line too long')) {
      tooLong = true
    }
    if (err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') tooLong = true

    if (isTimeout) {
      log('WARN', 'psExec', '-EncodedCommand timed out (' + (label || '') + ')')
      const exeDir = path.dirname(process.execPath)
      const dirs = [os.tmpdir(), exeDir]
      for (const dir of dirs) {
        const tempFile = path.join(dir, 'ps_' + crypto.randomBytes(4).toString('hex') + '.ps1')
        try {
          await fsp.writeFile(tempFile, '\uFEFF' + script, 'utf8')
          const { stdout } = await execP('powershell -ExecutionPolicy Bypass -File "' + tempFile + '"', { timeout: 30000, encoding: 'utf8' })
          log('OK', 'psExec', '-File fallback succeeded on timeout in ' + dir + ' ' + (label || ''))
          return { stdout }
        } catch (fallbackErr) {
          log('ERROR', 'psExec', '-File fallback also failed on timeout in ' + dir + ' ' + (label || ''), fallbackErr.message)
        } finally {
          try { await fsp.unlink(tempFile) } catch { }
        }
      }
      throw new Error('PowerShell timed out for ' + (label || 'script'))
    }

    if (tooLong) {
      log('WARN', 'psExec', '-EncodedCommand too long (' + scriptLen + ' chars), falling back to -File ' + (label || ''))
      const exeDir = path.dirname(process.execPath)
      const dirs = [os.tmpdir(), exeDir]
      for (const dir of dirs) {
        const tempFile = path.join(dir, 'ps_' + crypto.randomBytes(4).toString('hex') + '.ps1')
        try {
          await fsp.writeFile(tempFile, '\uFEFF' + script, 'utf8')
          const { stdout } = await execP('powershell -ExecutionPolicy Bypass -File "' + tempFile + '"', { timeout: 30000, encoding: 'utf8' })
          log('OK', 'psExec', '-File succeeded in ' + dir + ' ' + (label || ''))
          return { stdout }
        } catch (fallbackErr) {
          log('ERROR', 'psExec', '-File failed in ' + dir + ' ' + (label || ''), fallbackErr.message)
        } finally {
          try { await fsp.unlink(tempFile) } catch { }
        }
      }
      throw new Error('All PowerShell execution methods failed for ' + (label || 'script'))
    }
    log('ERROR', 'psExec', '-EncodedCommand failed (not too long) ' + (label || ''), err.message)
    if (err.stderr) log('ERROR', 'psExec', '-EncodedCommand stderr', err.stderr.toString().slice(0, 500))
    throw err
  }
}

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
  return ['marca', 'modelo', 'numero_serie', 'procesador', 'ram', 'almacenamiento', 'tipo_almacenamiento', 'sistema_operativo']
}

function emptyData() {
  const d = {}
  fieldsDefaults().forEach(function (f) { d[f] = '' })
  d.direccion_mac = getMacAddress()
  return d
}

async function detect() {
  log('INFO', 'detect', 'Starting auto-detection...')
  const script = '$data = @{}\n' +
    'try { $cs = Get-CimInstance Win32_ComputerSystem -ErrorAction Stop; $data.marca = $cs.Manufacturer; $data.modelo = $cs.Model } catch { }\n' +
    'try { $b = Get-CimInstance Win32_BIOS -ErrorAction Stop; $s = $b.SerialNumber; if ($s -eq \'System\') { $s = \'\' }; $data.numero_serie = $s } catch { }\n' +
    'try { $c = Get-CimInstance Win32_Processor -ErrorAction Stop; $data.procesador = ($c.Name -join \', \') } catch { }\n' +
    'try { $r = Get-CimInstance Win32_PhysicalMemory -ErrorAction Stop; $g = [math]::Round(($r | Measure-Object -Property Capacity -Sum).Sum / 1GB, 0); if ($g -gt 0) { $data.ram = ($g.ToString() + \' GB\') } } catch { }\n' +
    'try { $d = Get-CimInstance Win32_DiskDrive -ErrorAction Stop; $sg = [math]::Round(($d | ForEach-Object { $_.Size } | Measure-Object -Sum).Sum / 1GB, 0); if ($sg -gt 0) { $data.almacenamiento = ($sg.ToString() + \' GB\') }; $dm = ($d | Select-Object -ExpandProperty Model) -join \' \'; if ($dm -match \'nvme\') { $data.tipo_almacenamiento = \'NVMe\' } elseif ($dm -match \'ssd|solid\') { $data.tipo_almacenamiento = \'SSD\' } else { $data.tipo_almacenamiento = \'HDD\' } } catch { }\n' +
    'try { $o = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop; $data.sistema_operativo = ($o.Caption + \' \' + $o.Version).Trim() } catch { }\n' +
    '$data | ConvertTo-Json -Compress\n'

  try {
    const { stdout } = await psExec(script, '(detect)')
    let data = {}
    if (stdout && stdout.trim()) {
      try { data = JSON.parse(stdout.trim()) } catch { data = {} }
    }
    fieldsDefaults().forEach(function (f) { data[f] = data[f] || '' })
    data.direccion_mac = getMacAddress()
    const filled = fieldsDefaults().filter(function (f) { return data[f] }).length
    log('OK', 'detect', filled + '/' + fieldsDefaults().length + ' campos detectados', 'marca="' + (data.marca || '') + '" modelo="' + (data.modelo || '') + '" serie="' + (data.numero_serie || '') + '"')
    return data
  } catch (err) {
    log('ERROR', 'detect', err.message)
    if (err.stderr) log('ERROR', 'detect', 'stderr', err.stderr)
    return emptyData()
  }
}

async function detectMonitor() {
  log('INFO', 'detectMonitor', 'Starting monitor detection...')
  let script
  try {
    script = await fsp.readFile(path.join(__dirname, 'detect_monitor.ps1'), 'utf8')
    log('OK', 'detectMonitor', 'Script loaded (' + script.length + ' bytes)')
  } catch (err) {
    log('ERROR', 'detectMonitor', 'No se pudo leer detect_monitor.ps1', err.message)
    return []
  }

  try {
    const { stdout } = await psExec(script, '(monitor)')
    if (!stdout || stdout.trim() === '__NONE__' || stdout.trim() === '') {
      log('WARN', 'detectMonitor', 'No monitors detected (empty/NONE response)')
      return []
    }
    const parsed = JSON.parse(stdout.trim())
    if (!Array.isArray(parsed)) {
      log('WARN', 'detectMonitor', 'Unexpected response (not an array)')
      return []
    }
    const names = parsed.map(function (m) {
      return (m.ProductNameID || m.ProductName || m.P || m.UserFriendlyName || m.U || '').replace(/\0/g, '').trim()
    }).filter(Boolean)
    log('OK', 'detectMonitor', parsed.length + ' monitor(es) detectado(s)', names.length ? '"' + names.join('", "') + '"' : '(sin nombre)')
    return parsed.map(function (m) {
      const rawNames = [
        m.ManufacturerName || m.M || '',
        m.ProductNameID || m.ProductName || m.P || '',
        m.SerialNumberID || m.SerialNumber || m.S || '',
        m.UserFriendlyName || m.U || '',
        m.DiagonalInches || m.D || ''
      ]
      const pnpRaw = rawNames[0].toString().trim().toUpperCase()
      const pnp = pnpRaw.slice(0, 3)
      const modelo = rawNames[1].toString().replace(/\0/g, '').trim() || rawNames[3].toString().replace(/\0/g, '').trim()
      const serie = rawNames[2].toString().replace(/\0/g, '').trim()
      return {
        marca: PNP_MAP[pnp] || PNP_MAP[pnpRaw] || pnpRaw || '',
        modelo: modelo || '',
        serie: (serie && serie.length > 2 && serie !== '0') ? serie : '',
        tamano_pantalla: rawNames[4] ? rawNames[4] + '"' : ''
      }
    })
  } catch (err) {
    log('ERROR', 'detectMonitor', err.message)
    if (err.stderr) log('ERROR', 'detectMonitor', 'stderr', err.stderr.toString().slice(0, 1000))
    return []
  }
}

const server = http.createServer(function (req, res) {
  const startTime = Date.now()
  
  const send = function (status, body) {
    const elapsed = Date.now() - startTime
    const level = status >= 400 ? 'ERROR' : 'OK'
    log(level, 'HTTP', req.method + ' ' + req.url + ' → ' + status, '(' + elapsed + 'ms)')
    
    // CORRECCIÓN: Cabeceras CORS completas para todas las respuestas exitosas/errores
    res.writeHead(status, { 
      'Content-Type': 'application/json', 
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    })
    res.end(JSON.stringify(body))
  }

  // CORRECCIÓN: Bloque OPTIONS optimizado con soporte explícito para Private Network Access (PNA)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Private-Network': 'true' // Requerido por Chrome/Edge al consultar desde red externa (.178)
    })
    res.end()
    return
  }

  log('INFO', 'HTTP', req.method + ' ' + req.url)

  if (req.url === '/api/info') {
    detect().then(function (data) { send(200, data) }).catch(function (err) { send(500, { error: err.message }) })
  } else if (req.url === '/api/monitor') {
    detectMonitor().then(function (data) {
      if (!data || data.length === 0) { log('WARN', 'HTTP', '/api/monitor returned 0 monitors') }
      send(200, data)
    }).catch(function (err) { send(500, { error: err.message }) })
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

server.on('error', function (err) {
  if (err.code === 'EADDRINUSE') {
    log('ERROR', 'server', 'Puerto ' + PORT + ' ya está en uso. ¿Otro agentito corriendo?')
    process.exit(1)
  } else {
    log('ERROR', 'server', 'Error al iniciar', err.message)
    process.exit(1)
  }
})

// CORRECCIÓN: Escuchar en '0.0.0.0' para aceptar peticiones dirigidas a 127.0.0.1 y localhost transparentemente
server.listen(PORT, '0.0.0.0', function () {
  log('OK', 'server', 'Agentito corriendo y accesible localmente en el puerto ' + PORT)
  log('INFO', 'server', '  CPU:  http://127.0.0.1:' + PORT + '/api/info')
  log('INFO', 'server', '  Mon:  http://127.0.0.1:' + PORT + '/api/monitor')
  log('INFO', 'server', '  Ping: http://127.0.0.1:' + PORT + '/api/ping')
  log('INFO', 'server', 'Presiona Ctrl+C para detener')
})







// const http = require('node:http')
// const { exec } = require('node:child_process')
// const { promisify } = require('node:util')
// const fs = require('node:fs')
// const path = require('node:path')
// const os = require('node:os')
// const crypto = require('node:crypto')

// const fsp = fs.promises
// const execP = promisify(exec)
// const PORT = 5899

// function ts() {
//   const d = new Date()
//   return d.toLocaleTimeString('es-PE', { hour12: false })
// }

// function log(level, tag, msg, extra) {
//   const line = '[' + ts() + '] [' + level + '] [' + tag + '] ' + msg + (extra ? ' ' + extra : '')
//   console.log(line)
// }

// async function psExec(script, label) {
//   const encoded = Buffer.from(script, 'utf16le').toString('base64')
//   const scriptLen = encoded.length
//   log('INFO', 'psExec', 'Trying -EncodedCommand (' + scriptLen + ' chars) ' + (label || ''))
//   try {
//     const { stdout } = await execP('powershell -ExecutionPolicy Bypass -EncodedCommand ' + encoded, { timeout: 30000, encoding: 'utf8' })
//     log('OK', 'psExec', '-EncodedCommand succeeded ' + (label || ''))
//     return { stdout }
//   } catch (err) {
//     let tooLong = false
//     let isTimeout = err.killed === true
//     const stderrMsg = (err.stderr || err.message || '').toLowerCase()
//     if (stderrMsg.includes('demasiado larga') || stderrMsg.includes('too long') || stderrMsg.includes('command line') || stderrMsg.includes('command line too long')) {
//       tooLong = true
//     }
//     if (err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') tooLong = true

//     if (isTimeout) {
//       log('WARN', 'psExec', '-EncodedCommand timed out (' + (label || '') + ')')
//       const exeDir = path.dirname(process.execPath)
//       const dirs = [os.tmpdir(), exeDir]
//       for (const dir of dirs) {
//         const tempFile = path.join(dir, 'ps_' + crypto.randomBytes(4).toString('hex') + '.ps1')
//         try {
//           await fsp.writeFile(tempFile, '\uFEFF' + script, 'utf8')
//           const { stdout } = await execP('powershell -ExecutionPolicy Bypass -File "' + tempFile + '"', { timeout: 30000, encoding: 'utf8' })
//           log('OK', 'psExec', '-File fallback succeeded on timeout in ' + dir + ' ' + (label || ''))
//           return { stdout }
//         } catch (fallbackErr) {
//           log('ERROR', 'psExec', '-File fallback also failed on timeout in ' + dir + ' ' + (label || ''), fallbackErr.message)
//         } finally {
//           try { await fsp.unlink(tempFile) } catch { }
//         }
//       }
//       throw new Error('PowerShell timed out for ' + (label || 'script'))
//     }

//     if (tooLong) {
//       log('WARN', 'psExec', '-EncodedCommand too long (' + scriptLen + ' chars), falling back to -File ' + (label || ''))
//       const exeDir = path.dirname(process.execPath)
//       const dirs = [os.tmpdir(), exeDir]
//       for (const dir of dirs) {
//         const tempFile = path.join(dir, 'ps_' + crypto.randomBytes(4).toString('hex') + '.ps1')
//         try {
//           await fsp.writeFile(tempFile, '\uFEFF' + script, 'utf8')
//           const { stdout } = await execP('powershell -ExecutionPolicy Bypass -File "' + tempFile + '"', { timeout: 30000, encoding: 'utf8' })
//           log('OK', 'psExec', '-File succeeded in ' + dir + ' ' + (label || ''))
//           return { stdout }
//         } catch (fallbackErr) {
//           log('ERROR', 'psExec', '-File failed in ' + dir + ' ' + (label || ''), fallbackErr.message)
//         } finally {
//           try { await fsp.unlink(tempFile) } catch { }
//         }
//       }
//       throw new Error('All PowerShell execution methods failed for ' + (label || 'script'))
//     }
//     log('ERROR', 'psExec', '-EncodedCommand failed (not too long) ' + (label || ''), err.message)
//     if (err.stderr) log('ERROR', 'psExec', '-EncodedCommand stderr', err.stderr.toString().slice(0, 500))
//     throw err
//   }
// }

// const PNP_MAP = {
//   ACI: 'Acer', ACR: 'Acer', ACT: 'Acer',
//   ADI: 'ADI', AMW: 'AMW',
//   AOC: 'AOC', API: 'API', APP: 'Apple', ART: 'Artmedia',
//   ASR: 'ASRock',
//   AST: 'AST', AUO: 'AU Optronics', AUS: 'Asus',
//   BEN: 'BenQ', BMD: 'BMD', BNQ: 'BenQ', BOE: 'BOE',
//   CMO: 'Chimei', CMN: 'Chimei', CPL: 'Compal', CPT: 'CPT',
//   CTX: 'CTX',
//   DEC: 'DEC', DEL: 'Dell', DGC: 'DGC',
//   DMO: 'DMO', DTC: 'DTC', DWE: 'Daewoo',
//   EIZ: 'Eizo', ELO: 'Elo', ENC: 'ENC', EPI: 'EPI', ESK: 'ESK',
//   FUS: 'Fujitsu',
//   GBT: 'Gigabyte', GIG: 'Gigabyte',
//   GSM: 'LG', GWY: 'Gateway',
//   HEC: 'HEC', HIS: 'Hisense', HP: 'HP', HPN: 'HP', HSD: 'Hanns.G',
//   HTC: 'HTC', HUA: 'Huawei',
//   IBM: 'IBM', ICL: 'Iiyama', IFE: 'InFocus', IFC: 'InFocus',
//   INC: 'InnoLux', INS: 'Inseego', INT: 'Intrepid', INV: 'InnoLux',
//   IVM: 'Iiyama', IVO: 'IVO',
//   JDI: 'JDI', JVC: 'JVC',
//   KDC: 'Kodak', KTC: 'KTC',
//   LEN: 'Lenovo', LG: 'LG', LGD: 'LG', LPL: 'LG Philips', LTN: 'Lenovo',
//   MAG: 'Mag', MAX: 'Maxdata', MEL: 'Meltron', MER: 'Mercado',
//   MIR: 'Miro', MIT: 'Mitsubishi', MIZ: 'MiTAC', MMM: 'Mitsubishi',
//   MSI: 'MSI', MS_: 'Microsoft', MTC: 'MiTAC',
//   NAN: 'Nanao', NEC: 'NEC', NEO: 'Nec', NVD: 'NVIDIA',
//   OCL: 'Optoma', OLI: 'Olivetti', ONK: 'Onkyo', OOO: 'OEM', ORI: 'Origin',
//   PAN: 'Panasonic', PCC: 'Philips', PHL: 'Philips', PIO: 'Pioneer',
//   PLN: 'Planar', PLT: 'Planar', PNC: 'Pioneer', POS: 'Positivo',
//   PRO: 'Proview', PTS: 'Prestige',
//   REL: 'Relisys',
//   SAM: 'Samsung', SAN: 'Samsung', SBI: 'Smartelectronix',
//   SCA: 'Samsung', SDC: 'Samsung', SEC: 'Samsung',
//   SEG: 'Sege', SEI: 'SEI', SFT: 'Seifert', SGI: 'SGI', SGO: 'SGO',
//   SGT: 'SGT', SHG: 'Sharp', SHT: 'Sharp', SII: 'SII',
//   SMC: 'Sun', SMI: 'Smartelectronix', SNI: 'Siemens',
//   SNY: 'Sony', SON: 'Sony', SOR: 'Sorel', STD: 'STD',
//   STN: 'Stone', SUN: 'Sun', SVA: 'SVA', SYM: 'Symbian',
//   TAT: 'Tatung', TCL: 'TCL', TDC: 'TDK',
//   TOS: 'Toshiba', TSD: 'Toshiba', TST: 'Transtream',
//   TVM: 'TVM',
//   UNI: 'Unisys', UNK: 'Unknown',
//   V7: 'V7', VAI: 'Sony', VEW: 'Vestel',
//   VID: 'Videoseven', VII: 'VII', VIZ: 'Vizio',
//   VSC: 'ViewSonic', VTK: 'Vitek',
//   WAC: 'Wacom', WEC: 'WEC', WES: 'Westinghouse',
//   WIN: 'Wintek', WST: 'Westone',
//   XCM: 'Xenarc', XIA: 'Xiaomi', XMI: 'Xmind',
//   ZCM: 'Zalman', ZTC: 'ZTC'
// }

// function getMacAddress() {
//   const ifaces = os.networkInterfaces()
//   for (const name of Object.keys(ifaces)) {
//     for (const iface of ifaces[name]) {
//       if (!iface.internal && iface.family === 'IPv4' && iface.mac !== '00:00:00:00:00:00') {
//         return iface.mac
//       }
//     }
//   }
//   return ''
// }

// function fieldsDefaults() {
//   return ['marca', 'modelo', 'numero_serie', 'procesador', 'ram', 'almacenamiento', 'tipo_almacenamiento', 'sistema_operativo']
// }

// function emptyData() {
//   const d = {}
//   fieldsDefaults().forEach(function (f) { d[f] = '' })
//   d.direccion_mac = getMacAddress()
//   return d
// }

// async function detect() {
//   log('INFO', 'detect', 'Starting auto-detection...')
//   const script = '$data = @{}\n' +
//     'try { $cs = Get-CimInstance Win32_ComputerSystem -ErrorAction Stop; $data.marca = $cs.Manufacturer; $data.modelo = $cs.Model } catch { }\n' +
//     'try { $b = Get-CimInstance Win32_BIOS -ErrorAction Stop; $s = $b.SerialNumber; if ($s -eq \'System\') { $s = \'\' }; $data.numero_serie = $s } catch { }\n' +
//     'try { $c = Get-CimInstance Win32_Processor -ErrorAction Stop; $data.procesador = ($c.Name -join \', \') } catch { }\n' +
//     'try { $r = Get-CimInstance Win32_PhysicalMemory -ErrorAction Stop; $g = [math]::Round(($r | Measure-Object -Property Capacity -Sum).Sum / 1GB, 0); if ($g -gt 0) { $data.ram = ($g.ToString() + \' GB\') } } catch { }\n' +
//     'try { $d = Get-CimInstance Win32_DiskDrive -ErrorAction Stop; $sg = [math]::Round(($d | ForEach-Object { $_.Size } | Measure-Object -Sum).Sum / 1GB, 0); if ($sg -gt 0) { $data.almacenamiento = ($sg.ToString() + \' GB\') }; $dm = ($d | Select-Object -ExpandProperty Model) -join \' \'; if ($dm -match \'nvme\') { $data.tipo_almacenamiento = \'NVMe\' } elseif ($dm -match \'ssd|solid\') { $data.tipo_almacenamiento = \'SSD\' } else { $data.tipo_almacenamiento = \'HDD\' } } catch { }\n' +
//     'try { $o = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop; $data.sistema_operativo = ($o.Caption + \' \' + $o.Version).Trim() } catch { }\n' +
//     '$data | ConvertTo-Json -Compress\n'

//   try {
//     const { stdout } = await psExec(script, '(detect)')
//     let data = {}
//     if (stdout && stdout.trim()) {
//       try { data = JSON.parse(stdout.trim()) } catch { data = {} }
//     }
//     fieldsDefaults().forEach(function (f) { data[f] = data[f] || '' })
//     data.direccion_mac = getMacAddress()
//     const filled = fieldsDefaults().filter(function (f) { return data[f] }).length
//     log('OK', 'detect', filled + '/' + fieldsDefaults().length + ' campos detectados', 'marca="' + (data.marca || '') + '" modelo="' + (data.modelo || '') + '" serie="' + (data.numero_serie || '') + '"')
//     return data
//   } catch (err) {
//     log('ERROR', 'detect', err.message)
//     if (err.stderr) log('ERROR', 'detect', 'stderr', err.stderr)
//     return emptyData()
//   }
// }

// async function detectMonitor() {
//   log('INFO', 'detectMonitor', 'Starting monitor detection...')
//   let script
//   try {
//     script = await fsp.readFile(path.join(__dirname, 'detect_monitor.ps1'), 'utf8')
//     log('OK', 'detectMonitor', 'Script loaded (' + script.length + ' bytes)')
//   } catch (err) {
//     log('ERROR', 'detectMonitor', 'No se pudo leer detect_monitor.ps1', err.message)
//     return []
//   }

//   try {
//     const { stdout } = await psExec(script, '(monitor)')
//     if (!stdout || stdout.trim() === '__NONE__' || stdout.trim() === '') {
//       log('WARN', 'detectMonitor', 'No monitors detected (empty/NONE response)')
//       return []
//     }
//     const parsed = JSON.parse(stdout.trim())
//     if (!Array.isArray(parsed)) {
//       log('WARN', 'detectMonitor', 'Unexpected response (not an array)')
//       return []
//     }
//     const names = parsed.map(function (m) {
//       return (m.ProductNameID || m.ProductName || m.P || m.UserFriendlyName || m.U || '').replace(/\0/g, '').trim()
//     }).filter(Boolean)
//     log('OK', 'detectMonitor', parsed.length + ' monitor(es) detectado(s)', names.length ? '"' + names.join('", "') + '"' : '(sin nombre)')
//     return parsed.map(function (m) {
//       const rawNames = [
//         m.ManufacturerName || m.M || '',
//         m.ProductNameID || m.ProductName || m.P || '',
//         m.SerialNumberID || m.SerialNumber || m.S || '',
//         m.UserFriendlyName || m.U || '',
//         m.DiagonalInches || m.D || ''
//       ]
//       const pnpRaw = rawNames[0].toString().trim().toUpperCase()
//       const pnp = pnpRaw.slice(0, 3)
//       const modelo = rawNames[1].toString().replace(/\0/g, '').trim() || rawNames[3].toString().replace(/\0/g, '').trim()
//       const serie = rawNames[2].toString().replace(/\0/g, '').trim()
//       return {
//         marca: PNP_MAP[pnp] || PNP_MAP[pnpRaw] || pnpRaw || '',
//         modelo: modelo || '',
//         serie: (serie && serie.length > 2 && serie !== '0') ? serie : '',
//         tamano_pantalla: rawNames[4] ? rawNames[4] + '"' : ''
//       }
//     })
//   } catch (err) {
//     log('ERROR', 'detectMonitor', err.message)
//     if (err.stderr) log('ERROR', 'detectMonitor', 'stderr', err.stderr.toString().slice(0, 1000))
//     return []
//   }
// }

// const server = http.createServer(function (req, res) {
//   const startTime = Date.now()
//   const send = function (status, body) {
//     const elapsed = Date.now() - startTime
//     const level = status >= 400 ? 'ERROR' : 'OK'
//     log(level, 'HTTP', req.method + ' ' + req.url + ' → ' + status, '(' + elapsed + 'ms)')
//     res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
//     res.end(JSON.stringify(body))
//   }

//   if (req.method === 'OPTIONS') {
//     res.writeHead(204, { 
//       'Access-Control-Allow-Origin': '*', 
//       'Access-Control-Allow-Methods': 'GET, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type'
//     })
//     res.end()
//     return
//   }

//   log('INFO', 'HTTP', req.method + ' ' + req.url)

//   if (req.url === '/api/info') {
//     detect().then(function (data) { send(200, data) }).catch(function (err) { send(500, { error: err.message }) })
//   } else if (req.url === '/api/monitor') {
//     detectMonitor().then(function (data) {
//       if (!data || data.length === 0) { log('WARN', 'HTTP', '/api/monitor returned 0 monitors') }
//       send(200, data)
//     }).catch(function (err) { send(500, { error: err.message }) })
//   } else if (req.url === '/api/ping') {
//     send(200, { ok: true })
//   } else if (req.url === '/api/diagnose') {
//     send(200, {
//       ping: true,
//       pid: process.pid,
//       node: process.version,
//       usuario: os.userInfo().username,
//       hostname: os.hostname(),
//       windows: os.version(),
//       uptime_segundos: os.uptime()
//     })
//   } else {
//     send(404, { error: 'not found' })
//   }
// })

// server.on('error', function (err) {
//   if (err.code === 'EADDRINUSE') {
//     log('ERROR', 'server', 'Puerto ' + PORT + ' ya está en uso. ¿Otro agentito corriendo?')
//     process.exit(1)
//   } else {
//     log('ERROR', 'server', 'Error al iniciar', err.message)
//     process.exit(1)
//   }
// })

// // server.listen(PORT, function () {
// //   log('OK', 'server', 'Agentito corriendo en http://localhost:' + PORT)
// //   log('INFO', 'server', '  CPU:  http://localhost:' + PORT + '/api/info')
// //   log('INFO', 'server', '  Mon:  http://localhost:' + PORT + '/api/monitor')
// //   log('INFO', 'server', '  Ping: http://localhost:' + PORT + '/api/ping')
// //   log('INFO', 'server', 'Presiona Ctrl+C para detener')
// // })


// // Por esto:
// server.listen(PORT, '127.0.0.1', function () {
//   log('OK', 'server', 'Agentito seguro corriendo en http://127.0.0.1:' + PORT)
//   log('OK', 'server', 'Agentito corriendo en http://localhost:' + PORT)
//   log('INFO', 'server', '  CPU:  http://localhost:' + PORT + '/api/info')
//   log('INFO', 'server', '  Mon:  http://localhost:' + PORT + '/api/monitor')
//   log('INFO', 'server', '  Ping: http://localhost:' + PORT + '/api/ping')
//   log('INFO', 'server', 'Presiona Ctrl+C para detener')


// })
module.exports = __webpack_exports__;
/******/ })()
;