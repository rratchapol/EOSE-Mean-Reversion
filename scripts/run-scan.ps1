param(
  [switch]$MarketHoursOnly,
  [switch]$OffHoursOnly
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Now = Get-Date
$IsWeekday = $Now.DayOfWeek -notin @("Saturday", "Sunday")
$MarketOpen = Get-Date -Hour 6 -Minute 30 -Second 0
$MarketClose = Get-Date -Hour 13 -Minute 0 -Second 0
$IsMarketHours = $IsWeekday -and $Now -ge $MarketOpen -and $Now -le $MarketClose

if ($MarketHoursOnly -and -not $IsMarketHours) {
  Write-Output "Skipped: outside market hours."
  exit 0
}

if ($OffHoursOnly -and $IsMarketHours) {
  Write-Output "Skipped: market is open."
  exit 0
}

Set-Location $ProjectRoot
npm run scan
