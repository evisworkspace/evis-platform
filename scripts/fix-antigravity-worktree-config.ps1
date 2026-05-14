$ErrorActionPreference = "Stop"

Write-Host "EVIS / Antigravity preflight: Git worktree config" -ForegroundColor Cyan

$repoRoot = git rev-parse --show-toplevel 2>$null

if (-not $repoRoot) {
  Write-Host "Erro: execute este script dentro do repositório EVIS." -ForegroundColor Red
  exit 1
}

Set-Location $repoRoot

$configPath = Join-Path $repoRoot ".git\config"

if (-not (Test-Path $configPath)) {
  Write-Host "Erro: .git/config não encontrado." -ForegroundColor Red
  exit 1
}

$currentValue = git config --get extensions.worktreeConfig 2>$null

if ($currentValue -eq "true") {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backupPath = "$configPath.backup-antigravity-$timestamp"

  Copy-Item $configPath $backupPath -Force

  git config --unset extensions.worktreeConfig

  Write-Host "Corrigido: extensions.worktreeConfig=true foi removido." -ForegroundColor Green
  Write-Host "Backup criado em: $backupPath" -ForegroundColor Yellow
} else {
  Write-Host "OK: extensions.worktreeConfig não está ativo." -ForegroundColor Green
}

Write-Host "Preflight concluído." -ForegroundColor Cyan
