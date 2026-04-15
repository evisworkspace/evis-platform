# 🏗️ Manual de Infraestrutura — EVIS AI

Este guia orienta a instalação das ferramentas necessárias para a automação de áudio via WhatsApp.

## 🐳 Pré-requisito: Docker
A forma mais estável de rodar essas ferramentas é via Docker. Se não tiver instalado, baixe em: [docker.com](https://www.docker.com/products/docker-desktop/).

## 🚀 Passo 1: Docker Compose
Crie uma pasta chamada `infra` e salve o código abaixo em um arquivo chamado `docker-compose.yml`. (No ambiente de desenvolvimento do EVIS AI, esse arquivo já existe na pasta `infra/`):

```yaml
version: '3.8'

services:
  db_evolution:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=evis
      - POSTGRES_PASSWORD=evis-secret
      - POSTGRES_DB=evolution
    volumes:
      - evolution_db_data:/var/lib/postgresql/data

  evolution-api:
    image: atendai/evolution-api:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_TYPE=http
      - SERVER_PORT=8080
      - AUTH_TYPE=apikey
      - AUTH_API_KEY=evis-ai-secret-key
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evis:evis-secret@db_evolution:5432/evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
    depends_on:
      - db_evolution
    volumes:
      - evolution_data:/evolution/instances

  # Interface Visual (Manager)
  evolution-manager:
    image: atendai/evolution-manager:latest
    restart: always
    ports:
      - "8081:8081"
    environment:
      - EVOLUTION_API_URL=http://evolution-api:8080
      - EVOLUTION_API_KEY=evis-ai-secret-key
    depends_on:
      - evolution-api

  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
  evolution_data:
  evolution_db_data:
```

## 🛠️ Passo 2: Execução
No terminal, dentro de onde você salvou o arquivo (ex: a pasta `infra`), rode:
```bash
docker-compose up -d
```

## ⚙️ Passo 3: Configuração do n8n
1.  Acesse `http://localhost:5678`.
2.  Crie sua conta de administrador (primeiro acesso).
3.  Vá em **Workflows > New** e use a opção **Import from File**.
4.  Selecione o arquivo `docs/WORKFLOW_N8N_IMPORT.json` da pasta corporativa do projeto EVIS AI.

## 📱 Passo 4: Conectar WhatsApp (Evolution API)
1.  Acesse o Evolution Manager em `http://localhost:8081`.
2.  Crie uma nova instância (ex: "Evis-Bot"). O manager já estará pré-conectado à API (na porta 8080) pelos bastidores do Docker.
3.  Escaneie o QR Code com o WhatsApp da obra.
4.  Ao configurar o **Webhook** da instância para receber mensagens: 
    * **⚠️ Atenção:** Em vez de colar a URL exatamente como o n8n gera (ex: `http://localhost:5678/...`), você deve substituir o localhost para que funcione dentro da rede do Docker: utilize **`http://n8n:5678/...`** (substituindo apenas o começo).

---
*💡 **Dicas Vitais de Rede:***
- *Para o n8n conversar de volta com o seu servidor local nest (npm run dev na porta 3001), use o DNS do Docker: **`http://host.docker.internal:3001`**. Isso garante a conexão indiferente da sua internet ou rede WiFi.*
- *Para requisições do n8n ativas para o Evolution (ex: Send Message), certifique-se de direcionar os requests na LAN Dockerizada usando **`http://evolution-api:8080`**.*
