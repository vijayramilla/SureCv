foreach ($port in 3001, 3002) {
  try {
    Get-NetTCPConnection -LocalPort $port -ErrorAction Stop |
      ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
      }
  } catch {
    # Port not in use
  }
}
