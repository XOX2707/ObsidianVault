param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Source
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command cl -ErrorAction SilentlyContinue)) {
    $launch = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\Launch-VsDevShell.ps1"
    if (-not (Test-Path -LiteralPath $launch)) {
        Write-Error "Visual Studio 2022 Build Tools not found: $launch"
    }
    & $launch -Arch amd64 -SkipAutomaticLocation | Out-Null
}

if (-not (Test-Path -LiteralPath $Source)) {
    Write-Error "Source file not found: $Source"
}

$name = [System.IO.Path]::GetFileNameWithoutExtension($Source)
& cl /nologo /utf-8 "/Fe:$name.exe" $Source
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Output "built $name.exe"
Write-Output "run: .\$name.exe"
