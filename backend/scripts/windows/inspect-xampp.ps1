param([string]$XamppRoot = 'C:\xampp')
$ErrorActionPreference = 'Stop'
# Read-only checks: no service starts, database writes or Apache configuration edits.
$php = Join-Path $XamppRoot 'php\php.exe'
$apache = Join-Path $XamppRoot 'apache\bin\httpd.exe'
$mysql = Join-Path $XamppRoot 'mysql\bin\mysql.exe'
foreach ($executable in @($php, $apache, $mysql)) {
    if (!(Test-Path $executable)) { throw "Required XAMPP executable not found: $executable" }
}
Write-Output '=== XAMPP CLI PHP (not necessarily the Apache PHP runtime) ==='
& $php (Join-Path $PSScriptRoot '..\..\bin\diagnose.php')
$runtimeExit = $LASTEXITCODE
Write-Output '=== Apache version ==='
& $apache -v
Write-Output '=== Apache configuration syntax ==='
& $apache -t
$apacheExit = $LASTEXITCODE
Write-Output '=== Apache virtual hosts ==='
& $apache -S
Write-Output '=== Apache modules ==='
& $apache -M
Write-Output '=== Database CLIENT version (server version requires diagnose.php --database) ==='
& $mysql --version
Write-Output '=== Composer ==='
$composer = Get-Command composer -ErrorAction SilentlyContinue
if ($composer) { & $composer.Source --version } else { Write-Output 'Composer not found on PATH.' }
if ($runtimeExit -ne 0 -or $apacheExit -ne 0) { exit 1 }
