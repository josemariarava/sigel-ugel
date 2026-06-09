Write-Output "=== Step 1 ==="
try {
  $m = Get-CimInstance -Namespace root/wmi -Class WmiMonitorID -ErrorAction SilentlyContinue
  Write-Output "WmiMonitorID count: $($m.Count)"
  if ($m -and $m.Count -gt 0) {
    Write-Output "Has monitors via CIM"
  }
} catch { Write-Output "CIM error: $_" }

Write-Output "=== Step 2 ==="
try {
  $m2 = Get-WmiObject -Namespace root/wmi -Class WmiMonitorID -ErrorAction SilentlyContinue
  Write-Output "WmiObject count: $($m2.Count)"
  if ($m2 -and $m2.Count -gt 0) {
    Write-Output "Has monitors via WMI"
  }
} catch { Write-Output "WMI error: $_" }

Write-Output "=== Step 3 ==="
try {
  $reg = 'HKLM:\SYSTEM\CurrentControlSet\Enum\DISPLAY'
  $items = Get-ChildItem -Path $reg -ErrorAction SilentlyContinue | ForEach-Object { Get-ChildItem -Path $_.PsPath -ErrorAction SilentlyContinue } | ForEach-Object { Get-ChildItem -Path $_.PsPath -ErrorAction SilentlyContinue }
  Write-Output "Registry items: $($items.Count)"
  foreach ($item in $items) {
    Write-Output "Item: $($item.PsPath)"
  }
} catch { Write-Output "Registry error: $_" }
