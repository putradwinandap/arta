param(
  [ValidateSet("fix", "check")]
  [string]$Mode = "fix"
)

$ErrorActionPreference = "Stop"

$serverPath = Join-Path $PSScriptRoot "..\server"
Push-Location $serverPath
try {
  if ($Mode -eq "fix") {
    Write-Host "==> Formatting Go sources"
    & gofmt -w .
  } else {
    Write-Host "==> Checking Go formatting"
    $unformatted = @( & gofmt -l . )
    if ($unformatted.Count -gt 0) {
      Write-Error ("Go files need gofmt:`n" + ($unformatted -join "`n"))
    }
  }

  Write-Host "==> Running Go tests"
  & go test ./...
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host "==> Building Arta server"
  & go build ./cmd/arta
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host "Server verification passed."
} finally {
  Pop-Location
}
