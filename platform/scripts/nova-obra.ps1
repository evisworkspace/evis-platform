param(
  [Parameter(Mandatory = $true)]
  [string]$NomeObra,

  [string]$Cliente = "",

  [int]$Ano = 2026,

  [string]$Codigo = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Remove-Diacritics {
  param([string]$Text)

  $normalized = $Text.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder

  foreach ($char in $normalized.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($char) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  return $builder.ToString().Normalize([Text.NormalizationForm]::FormC)
}

function Convert-ToSlug {
  param([string]$Text)

  $clean = Remove-Diacritics $Text
  $clean = $clean -replace "[^A-Za-z0-9]+", "_"
  $clean = $clean -replace "_{2,}", "_"
  return $clean.Trim("_")
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$orcamentosRoot = Get-ChildItem -Path $repoRoot -Directory |
  Where-Object { $_.Name -like "Or*amentos_2026" } |
  Select-Object -First 1 -ExpandProperty FullName

if ([string]::IsNullOrWhiteSpace($orcamentosRoot)) {
  throw "Pasta raiz de orcamentos nao encontrada. Esperado algo como Orçamentos_2026."
}

$basePath = Join-Path $orcamentosRoot "Orcamentista_base"

if (-not (Test-Path $basePath)) {
  throw "Base nao encontrada em: $basePath"
}

if ([string]::IsNullOrWhiteSpace($Codigo)) {
  $existing = Get-ChildItem -Path $orcamentosRoot -Directory |
    Where-Object { $_.Name -match "^ORC_$Ano-(\d{3})_" } |
    ForEach-Object { [int]$Matches[1] }

  $nextNumber = if ($existing.Count -gt 0) { ($existing | Measure-Object -Maximum).Maximum + 1 } else { 1 }
  $Codigo = "ORC_{0}-{1}" -f $Ano, $nextNumber.ToString("000")
}

$slug = Convert-ToSlug $NomeObra
if ([string]::IsNullOrWhiteSpace($slug)) {
  throw "Nao foi possivel gerar nome de pasta a partir de NomeObra."
}

$folderName = "{0}_{1}" -f $Codigo, $slug
$destPath = Join-Path $orcamentosRoot $folderName

if (Test-Path $destPath) {
  throw "Ja existe uma pasta com este nome: $destPath"
}

Copy-Item -LiteralPath $basePath -Destination $destPath -Recurse

$briefingPath = Join-Path $destPath "00_BRIEFING.md"
$memoryPath = Join-Path $destPath "01_MEMORIA_ORCAMENTO.json"

$briefing = Get-Content -LiteralPath $briefingPath -Raw
$briefing = $briefing.Replace("ORC-AAAA-000", $Codigo)
$briefing = $briefing.Replace("| Nome da obra | |", "| Nome da obra | $NomeObra |")
if (-not [string]::IsNullOrWhiteSpace($Cliente)) {
  $briefing = $briefing.Replace("| Cliente | |", "| Cliente | $Cliente |")
}
[IO.File]::WriteAllText($briefingPath, $briefing, [Text.UTF8Encoding]::new($false))

$memory = Get-Content -LiteralPath $memoryPath -Raw | ConvertFrom-Json
$memory.orcamento_id = $Codigo
$memory.obra.nome = $NomeObra
if (-not [string]::IsNullOrWhiteSpace($Cliente)) {
  $memory.obra.cliente = $Cliente
}
$memory | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $memoryPath -Encoding utf8

Write-Host ""
Write-Host "Nova obra criada com sucesso:" -ForegroundColor Green
Write-Host $destPath
Write-Host ""
Write-Host "Orcamento ID: $Codigo"
Write-Host "Nome da obra: $NomeObra"
if (-not [string]::IsNullOrWhiteSpace($Cliente)) {
  Write-Host "Cliente: $Cliente"
}
Write-Host ""
Write-Host "Proximo passo:"
Write-Host "1. Colocar os arquivos em anexos/projeto, anexos/fornecedores e anexos/referencias"
Write-Host "2. Abrir o projeto EVIS no Antigravity"
Write-Host "3. Trabalhar dentro desta pasta da obra"
