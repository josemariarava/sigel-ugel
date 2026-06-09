try {
  $m = Get-CimInstance -Namespace root/wmi -Class WmiMonitorID -ErrorAction Stop
  Write-Output "WmiMonitorID count: $($m.Count)"
  if ($m) {
    foreach ($mon in $m) {
      $manuf = ($mon.ManufacturerName | ? { $_ -ne 0 }) -join ''
      $prod = ($mon.ProductNameID | ? { $_ -ne 0 }) -join ''
      $serial = ($mon.SerialNumberID | ? { $_ -ne 0 }) -join ''
      Write-Output "  ManufacturerName: $manuf"
      Write-Output "  ProductName: $prod"
      Write-Output "  SerialNumberID: $serial"
    }
  }
  $p = Get-CimInstance -Namespace root/wmi -Class WmiMonitorBasicDisplayParams -ErrorAction Stop
  if ($p) {
    foreach ($param in $p) {
      $w = $param.MaxHorizontalImageSize
      $h = $param.MaxVerticalImageSize
      Write-Output "  Size: ${w}cm x ${h}cm"
      if ($w -and $h -and $w -gt 0 -and $h -gt 0) {
        $diag = [math]::Round([math]::Sqrt($w*$w + $h*$h) / 2.54, 0)
        Write-Output "  Diagonal: ${diag}in"
      }
    }
  }
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
}
