$tasks = @(
  "EOSE Scanner - Market Hours 15m",
  "EOSE Scanner - Off Hours Noon"
)

foreach ($task in $tasks) {
  Unregister-ScheduledTask -TaskName $task -Confirm:$false -ErrorAction SilentlyContinue
}

Write-Output "Removed EOSE Scanner scheduled tasks."
