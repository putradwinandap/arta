param(
    [Parameter(Position = 0)]
    [ValidateSet('setup', 'start', 'stop', 'status', 'update')]
    [string]$Command = 'setup'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root '.env'

function Fail([string]$Message) {
    Write-Error "Arta: $Message"
    exit 1
}

function Require-Runtime {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Fail 'Docker is required. Install Docker Desktop first.'
    }
    try { docker compose version | Out-Null } catch { Fail "Docker Compose v2 is required (the 'docker compose' command)." }
    if ($LASTEXITCODE -ne 0) { Fail "Docker Compose v2 is required (the 'docker compose' command)." }
    try { docker info | Out-Null } catch { Fail 'Docker is installed but is not running. Start Docker Desktop and retry.' }
    if ($LASTEXITCODE -ne 0) { Fail 'Docker is installed but is not running. Start Docker Desktop and retry.' }
}

function New-Hex([int]$Bytes) {
    $buffer = New-Object byte[] $Bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($buffer)
    } finally {
        $rng.Dispose()
    }
    return (($buffer | ForEach-Object { $_.ToString('x2') }) -join '')
}

function Ensure-Env {
    if (Test-Path $EnvFile) {
        Write-Host 'Arta: keeping existing .env configuration.'
        return
    }

    $dbPassword = New-Hex 24
    $sessionSecret = New-Hex 32
    @"
ARTA_POSTGRES_DB=arta
ARTA_POSTGRES_USER=arta
ARTA_POSTGRES_PASSWORD=$dbPassword
ARTA_SESSION_SECRET=$sessionSecret
ARTA_HTTP_PORT=8080
"@ | Set-Content -Path $EnvFile -Encoding utf8
    Write-Host 'Arta: created .env with generated local credentials.'
}

function Invoke-Setup {
    Require-Runtime
    Ensure-Env
    Push-Location $Root
    try {
        docker compose config | Out-Null
        if ($LASTEXITCODE -ne 0) { Fail 'Generated configuration is invalid. Check .env and compose.yaml.' }
    } finally { Pop-Location }
    Write-Host '.\scripts\arta.ps1 start'
}

function Invoke-Start {
    Require-Runtime
    Ensure-Env
    Push-Location $Root
    try {
        docker compose up -d --build
        if ($LASTEXITCODE -ne 0) { Fail 'Docker Compose could not start Arta.' }
    } finally { Pop-Location }
    $portLine = Get-Content $EnvFile | Where-Object { $_ -match '^ARTA_HTTP_PORT=' } | Select-Object -Last 1
    $port = if ($portLine) { ($portLine -split '=', 2)[1] } else { '8080' }
    Write-Host "Arta: started. Open http://localhost:$port"
}

function Invoke-Stop {
    Require-Runtime
    Push-Location $Root
    try { docker compose down } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Fail 'Docker Compose could not stop Arta cleanly.' }
    Write-Host 'Arta: stopped. Persistent PostgreSQL data was kept.'
}

function Invoke-Status {
    Require-Runtime
    Push-Location $Root
    try { docker compose ps } finally { Pop-Location }
}

function Invoke-Update {
    Require-Runtime
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Fail 'Git is required for the source-checkout update flow. Install Git or replace the checkout manually.'
    }
    Push-Location $Root
    try {
        $dirty = git status --porcelain
        if ($dirty) { Fail 'Working tree has local changes. Commit or stash them before updating.' }
        git pull --ff-only
        if ($LASTEXITCODE -ne 0) { Fail 'Git could not fast-forward this checkout.' }
        Ensure-Env
        docker compose up -d --build
        if ($LASTEXITCODE -ne 0) { Fail 'Arta could not rebuild after updating.' }
    } finally { Pop-Location }
    Write-Host 'Arta: updated and started. Existing PostgreSQL data was preserved and migrations ran automatically.'
}

switch ($Command) {
    'setup' { Invoke-Setup }
    'start' { Invoke-Start }
    'stop' { Invoke-Stop }
    'status' { Invoke-Status }
    'update' { Invoke-Update }
}
