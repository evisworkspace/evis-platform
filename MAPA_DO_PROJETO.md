# 🗺️ Mapa do Projeto - Evis AI

Este arquivo define a estrutura organizacional do projeto por domínios e pilares técnicos.

## 🏷️ Sistema de Tags
- **`[HUB]`**: Interface do usuário e navegação.
- **`[ORC]`**: Módulo Orçamentista.
- **`[PRP]`**: Módulo de Propostas.
- **`[INFRA]`**: Backend, Banco de Dados e Scripts.
- **`[AI]`**: Inteligência Artificial (Skills, Agentes).
- **`[DATA]`**: Dados de projetos e históricos.

---

## 📂 Arquitetura de Pastas

### 1. 🏢 Domínios de Negócio (`/domains`)
Onde reside a inteligência e as regras de negócio de cada frente.
- **`orcamentista/`**:
    - `logic/`: Lógica central do motor de orçamentos `[ORC]`.
    - `skills/`: Habilidades de IA para o orçamentista `[AI]`.
    - `tools/`: Ferramentas auxiliares (PDF Interpreter, etc) `[AI]`.
    - `vault/`: Banco de dados de orçamentos realizados `[DATA]`.
- **`proposta/`**:
    - `logic/`: Lógica de geração de propostas `[PRP]`.
    - `templates/`: Templates HTML/CSS para propostas.
    - `vault/`: Histórico de propostas geradas `[DATA]`.
- **`institucional/`**:
    - `web/`: Código-fonte do site institucional `[HUB]`.
    - `assets/`: Imagens, logos e mídia institucional.
    - `copy/`: Textos, roteiros e materiais de marketing.

### 2. ⚙️ Plataforma e Infra (`/platform`)
A base tecnológica que sustenta o ecossistema.
- **`server/`**: Backend em Node.js / Express `[INFRA]`.
- **`infra/`**: Docker, SQL Schemas e configurações de Cloud `[INFRA]`.
- **`scripts/`**: Utilitários de automação e manutenção.
- **`docs/`**: Documentação técnica, prompts e manuais.

### 3. 💻 Aplicações e UI (`/src`, `/index.html`)
As interfaces de interação com o usuário `[HUB]`.
- **`src/`**: Código-fonte React/Vite.
- **`hub.html`**: Portal central de aplicações.

---

## 🛠️ Manutenção
Para manter a organização, evite criar pastas na raiz. Se for uma nova funcionalidade, verifique se ela pertence a um **Domínio** existente ou se exige a criação de um novo em `/domains`.
