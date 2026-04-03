$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Resolve-Path (Join-Path $ScriptDir "..")

Set-Location $BackendDir

if (-not (Test-Path ".env")) {
  Write-Host ".env dosyasi bulunamadi. Once .env.example dosyasini .env olarak kopyalayin."
  exit 1
}

docker compose up -d postgres
npm install
npx prisma generate

Write-Host ""
Write-Host "Sonraki komutlar:"
Write-Host "  npm run prisma:migrate -- --name init"
Write-Host "  npm run start:dev"
