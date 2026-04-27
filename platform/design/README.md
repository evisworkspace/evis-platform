# Berti Design System — Tokens

Arquivo de origem: `platform/design/tokens.css`

## Como usar

Importe no CSS principal de cada módulo:

```css
@import '../../../platform/design/tokens.css';
```

O caminho relativo varia por módulo:
- **EVIS Obra** (`src/index.css`): `@import '../platform/design/tokens.css'`
- **Institucional** (`domains/institucional/web/src/`): `@import '../../../../platform/design/tokens.css'`

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `--berti-dark` | `#141614` | Background principal (dark) |
| `--berti-sage` | `#3D5A46` | Hover, acento secundário |
| `--berti-gold` | `#D4AE37` | Destaque, CTA, acento primário |
| `--berti-ink` | `#8D1E00` | Erros, alertas críticos |
| `--berti-light` | `#F9F8F6` | Background claro, superfícies |

## Tipografia

| Token | Valor | Uso |
|---|---|---|
| `--font-display` | Cormorant Garamond, Georgia | Títulos, headers |
| `--font-sans` | Outfit, system-ui | Corpo, UI |

## Espaçamentos

| Token | Valor |
|---|---|
| `--radius-sm` | 2px |
| `--radius-md` | 4px |
