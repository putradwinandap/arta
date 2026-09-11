param(
    [Parameter(Position = 0)]
    [ValidateSet('setup', 'start', 'stop', 'status', 'update', 'reset')]
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

function Invoke-Reset {
    Require-Runtime

    $confirmationPhrase = 'DELETE ALL ARTA DATA'
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Red
    Write-Host ' DANGER: DESTRUCTIVE ARTA RESET' -ForegroundColor Red
    Write-Host '============================================================' -ForegroundColor Red
    Write-Host 'This operation permanently deletes ALL local Arta PostgreSQL data.' -ForegroundColor Yellow
    Write-Host 'This includes wallets, transactions, budgets, goals, household data,' -ForegroundColor Yellow
    Write-Host 'and any other information stored in the local database.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'The database volume will be removed and local credentials regenerated.' -ForegroundColor Yellow
    Write-Host 'THIS CANNOT BE UNDONE.' -ForegroundColor Red
    Write-Host 'If this installation contains anything important, stop now and back it up first.' -ForegroundColor Red
    Write-Host ''
    Write-Host "To continue, type this exact phrase:" -ForegroundColor Cyan
    Write-Host "  $confirmationPhrase" -ForegroundColor White
    Write-Host ''

    $confirmation = Read-Host 'Confirmation'
    if ($confirmation -cne $confirmationPhrase) {
        Write-Host 'Arta: reset cancelled. No data was deleted.' -ForegroundColor Green
        return
    }

    Write-Host 'Arta: destructive reset confirmed. Deleting local database volume...' -ForegroundColor Red

    $oldDbPassword = $env:ARTA_POSTGRES_PASSWORD
    $oldSessionSecret = $env:ARTA_SESSION_SECRET
    $hadDbPassword = Test-Path Env:ARTA_POSTGRES_PASSWORD
    $hadSessionSecret = Test-Path Env:ARTA_SESSION_SECRET

    Push-Location $Root
    try {
        # Placeholder values let Compose resolve required variables even when .env is missing.
        $env:ARTA_POSTGRES_PASSWORD = 'arta-reset-placeholder'
        $env:ARTA_SESSION_SECRET = 'arta-reset-placeholder'
        docker compose down -v --remove-orphans
        if ($LASTEXITCODE -ne 0) { Fail 'Docker Compose could not reset Arta local data.' }
    } finally {
        Pop-Location
        if ($hadDbPassword) { $env:ARTA_POSTGRES_PASSWORD = $oldDbPassword } else { Remove-Item Env:ARTA_POSTGRES_PASSWORD -ErrorAction SilentlyContinue }
        if ($hadSessionSecret) { $env:ARTA_SESSION_SECRET = $oldSessionSecret } else { Remove-Item Env:ARTA_SESSION_SECRET -ErrorAction SilentlyContinue }
    }

    if (Test-Path $EnvFile) {
        Remove-Item $EnvFile -Force
    }
    Ensure-Env
    Write-Host 'Arta: local data reset complete. Run: .\scripts\arta.ps1 start'
}

switch ($Command) {
    'setup' { Invoke-Setup }
    'start' { Invoke-Start }
    'stop' { Invoke-Stop }
    'status' { Invoke-Status }
    'update' { Invoke-Update }
    'reset' { Invoke-Reset }
}
