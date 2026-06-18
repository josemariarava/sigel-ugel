function D($a) { if (-not $a) { return '' }; return (-join ($a | % { [char]$_ })).Trim([char]0) }
function G($w,$h) { if ($w -and $h -and $w -gt 0 -and $h -gt 0) { return [math]::Round([math]::Sqrt($w*$w+$h*$h)/2.54,0) }; return 0 }
function C($r) { if (-not $r) { return '' }; $n=($r -split ';'|Select-Object -Last 1)-replace '^(Monitor\s*|Generic\s*|PnP\s*|Plug and Play\s*)',''; if (-not $n) { $n=($r -split ';'|Select-Object -Last 1) }; return $n.Trim() }
function P($h) { if (-not $h) { return '' }; $i=''; if ($h -is [array]) { $i=$h[0] } else { $i=$h }; return ($i -replace '^MONITOR\\','' -replace '\\.*','') }

$list = @()

# Registry first (fast, no WMI dependency)
try {
  $items = Get-ChildItem 'HKLM:\SYSTEM\CurrentControlSet\Enum\DISPLAY' -ErrorAction SilentlyContinue | % { Get-ChildItem $_.PsPath -ErrorAction SilentlyContinue }
  $seen = @{}
  foreach ($item in $items) {
    try {
      $dev = (Get-ItemProperty $item.PsPath -Name DeviceDesc -ErrorAction SilentlyContinue).DeviceDesc
      $hwid = (Get-ItemProperty $item.PsPath -Name HardwareID -ErrorAction SilentlyContinue).HardwareID
      if ($dev) { $name=C $dev; $pnp=P $hwid; if (-not $seen.ContainsKey($name)) { $seen[$name]=$true; $list += [PSCustomObject]@{M=$pnp;P=$name;S='';U=$name;D=0} } }
    } catch {}
  }
} catch {}

# WMI/DCOM fallback (faster than CIM on older PCs)
if ($list.Count -eq 0) {
  try {
    $mons = Get-WmiObject -Namespace root\wmi -Class WmiMonitorID -ErrorAction SilentlyContinue
    $pars = @(Get-WmiObject -Namespace root\wmi -Class WmiMonitorBasicDisplayParams -ErrorAction SilentlyContinue)
    $pmap = @{}; foreach ($p in $pars) { $pmap[$p.InstanceName]=$p }
    if ($mons) { foreach ($m in $mons) { $w=0;$h=0;$p=$pmap[$m.InstanceName]; if ($p) { $w=$p.MaxHorizontalImageSize;$h=$p.MaxVerticalImageSize }; $list += [PSCustomObject]@{M=D $m.ManufacturerName;P=D $m.ProductNameID;S=D $m.SerialNumberID;U=D $m.UserFriendlyName;D=G $w $h} } }
  } catch {}
}
# CIM fallback (last resort)
if ($list.Count -eq 0) {
  try {
    $mons = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction SilentlyContinue
    $pars = @(Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorBasicDisplayParams -ErrorAction SilentlyContinue)
    $pmap = @{}; foreach ($p in $pars) { $pmap[$p.InstanceName]=$p }
    if ($mons) { foreach ($m in $mons) { $w=0;$h=0;$p=$pmap[$m.InstanceName]; if ($p) { $w=$p.MaxHorizontalImageSize;$h=$p.MaxVerticalImageSize }; $list += [PSCustomObject]@{M=D $m.ManufacturerName;P=D $m.ProductNameID;S=D $m.SerialNumberID;U=D $m.UserFriendlyName;D=G $w $h} } }
  } catch {}
}

if ($list.Count -eq 0) { Write-Output '__NONE__'; return }
$list | ConvertTo-Json -Compress
