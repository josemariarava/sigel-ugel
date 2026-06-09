function DecodeBytes($arr) {
  if (-not $arr) { return '' }
  return (-join ($arr | ForEach-Object { [char]$_ })).Trim([char]0)
}

function GetDiagonal($w, $h) {
  if ($w -and $h -and $w -gt 0 -and $h -gt 0) {
    return [math]::Round([math]::Sqrt($w*$w + $h*$h) / 2.54, 0)
  }
  return 0
}

function CleanMonitorName($raw) {
  if (-not $raw) { return '' }
  $name = ($raw -split ';' | Select-Object -Last 1)
  $name = $name -replace '^(Monitor\s*|Generic\s*|PnP\s*|Plug and Play\s*)', ''
  if (-not $name) { $name = ($raw -split ';' | Select-Object -Last 1) }
  return $name.Trim()
}

function ExtractPnpId($hwid) {
  if (-not $hwid) { return '' }
  $id = ''
  if ($hwid -is [array]) { $id = $hwid[0] } else { $id = $hwid }
  return ($id -replace '^MONITOR\\', '' -replace '\\.*', '')
}

$list = @()

# ── Method 1: CIM ──
try {
  $monitores = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction SilentlyContinue
  $params = @(Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorBasicDisplayParams -ErrorAction SilentlyContinue)
  $paramsByInstance = @{}
  foreach ($p in $params) { $paramsByInstance[$p.InstanceName] = $p }
  if ($monitores) {
    foreach ($m in $monitores) {
      $w = 0; $h = 0
      $p = $paramsByInstance[$m.InstanceName]
      if ($p) { $w = $p.MaxHorizontalImageSize; $h = $p.MaxVerticalImageSize }
      $list += [PSCustomObject]@{
        ManufacturerName = DecodeBytes $m.ManufacturerName
        ProductName      = DecodeBytes $m.ProductNameID
        SerialNumberID   = DecodeBytes $m.SerialNumberID
        UserFriendlyName = DecodeBytes $m.UserFriendlyName
        DiagonalInches   = GetDiagonal $w $h
      }
    }
  }
} catch {}

# ── Method 2: WMI fallback ──
if ($list.Count -eq 0) {
  try {
    $monitores = Get-WmiObject -Namespace root\wmi -Class WmiMonitorID -ErrorAction SilentlyContinue
    $params = @(Get-WmiObject -Namespace root\wmi -Class WmiMonitorBasicDisplayParams -ErrorAction SilentlyContinue)
    $paramsByInstance = @{}
    foreach ($p in $params) { $paramsByInstance[$p.InstanceName] = $p }
    if ($monitores) {
      foreach ($m in $monitores) {
        $w = 0; $h = 0
        $p = $paramsByInstance[$m.InstanceName]
        if ($p) { $w = $p.MaxHorizontalImageSize; $h = $p.MaxVerticalImageSize }
        $list += [PSCustomObject]@{
          ManufacturerName = DecodeBytes $m.ManufacturerName
          ProductName      = DecodeBytes $m.ProductNameID
          SerialNumberID   = DecodeBytes $m.SerialNumberID
          UserFriendlyName = DecodeBytes $m.UserFriendlyName
          DiagonalInches   = GetDiagonal $w $h
        }
      }
    }
  } catch {}
}

# ── Method 3: Registry fallback ──
if ($list.Count -eq 0) {
  try {
    $reg = 'HKLM:\SYSTEM\CurrentControlSet\Enum\DISPLAY'
    $items = Get-ChildItem -Path $reg -ErrorAction SilentlyContinue | ForEach-Object { Get-ChildItem -Path $_.PsPath -ErrorAction SilentlyContinue }
    $seen = @{}
    foreach ($item in $items) {
      try {
        $dev = (Get-ItemProperty -Path $item.PsPath -Name 'DeviceDesc' -ErrorAction SilentlyContinue).DeviceDesc
        $hwid = (Get-ItemProperty -Path $item.PsPath -Name 'HardwareID' -ErrorAction SilentlyContinue).HardwareID
        if ($dev) {
          $name = CleanMonitorName $dev
          $pnp = ExtractPnpId $hwid
          if (-not $seen.ContainsKey($name)) { $seen[$name] = $true; $list += [PSCustomObject]@{ ManufacturerName = $pnp; ProductName = $name; SerialNumberID = ''; UserFriendlyName = $name; DiagonalInches = 0 } }
        }
      } catch {}
    }
  } catch {}
}

if ($list.Count -eq 0) { Write-Output '__NONE__'; return }
$list | ConvertTo-Json -Compress
