const { execSync } = require('node:child_process')

const cmd = `powershell -Command "& {
    try {
      $m = Get-CimInstance -Namespace root/wmi -Class WmiMonitorID -ErrorAction Stop
      $p = Get-CimInstance -Namespace root/wmi -Class WmiMonitorBasicDisplayParams -ErrorAction Stop
      $list = @()
      for ($i = 0; $i -lt $m.Count; $i++) {
        $manuf = ($m[$i].ManufacturerName | ? { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join ''
        $prod = ($m[$i].ProductName | ? { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join ''
        $serial = ($m[$i].SerialNumberID | ? { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join ''
        $name = ($m[$i].UserFriendlyName | ? { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join ''
        $w = $p[$i].MaxHorizontalImageSize
        $h = $p[$i].MaxVerticalImageSize
        $diag = 0
        if ($w -and $h -and $w -gt 0 -and $h -gt 0) {
          $diag = [math]::Round([math]::Sqrt($w*$w + $h*$h) / 2.54, 0)
        }
        $list += [PSCustomObject]@{
          ManufacturerName = $manuf
          ProductName = $prod
          SerialNumberID = $serial
          UserFriendlyName = $name
          DiagonalInches = $diag
        }
      }
      if ($list.Count -eq 0) { Write-Output '__NONE__'; return }
      ConvertTo-Json -InputObject $list -Compress
    } catch { Write-Output '__NONE__' }
  }"`

console.log("=== Generated command ===")
console.log(cmd)
