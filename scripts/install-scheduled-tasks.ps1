$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$RunScript = Join-Path $PSScriptRoot "run-scan.ps1"
$PowerShell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"

$MarketTask = "EOSE Scanner - Market Hours 15m"
$NoonTask = "EOSE Scanner - Off Hours Noon"

$MarketAction = New-ScheduledTaskAction `
  -Execute $PowerShell `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$RunScript`" -MarketHoursOnly" `
  -WorkingDirectory $ProjectRoot

$MarketTriggers = @()
$Time = Get-Date -Hour 6 -Minute 30 -Second 0
$End = Get-Date -Hour 13 -Minute 0 -Second 0
while ($Time -le $End) {
  $MarketTriggers += New-ScheduledTaskTrigger -Daily -At $Time
  $Time = $Time.AddMinutes(15)
}

Register-ScheduledTask `
  -TaskName $MarketTask `
  -Action $MarketAction `
  -Trigger $MarketTriggers `
  -Description "Scan EOSE every 15 minutes during US market hours, local Pacific schedule." `
  -Force | Out-Null

$NoonAction = New-ScheduledTaskAction `
  -Execute $PowerShell `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$RunScript`" -OffHoursOnly" `
  -WorkingDirectory $ProjectRoot

$NoonTrigger = New-ScheduledTaskTrigger -Daily -At 12:00pm

Register-ScheduledTask `
  -TaskName $NoonTask `
  -Action $NoonAction `
  -Trigger $NoonTrigger `
  -Description "Scan EOSE at noon only when outside market hours." `
  -Force | Out-Null

Write-Output "Installed scheduled tasks:"
Write-Output "- $MarketTask"
Write-Output "- $NoonTask"
