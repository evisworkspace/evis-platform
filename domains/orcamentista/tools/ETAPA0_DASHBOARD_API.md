# EVIS Etapa 0 - API local para dashboard

Esta API e a ponte entre o dashboard HTML/React e os motores Python da Etapa 0.

```txt
Dashboard -> HTTP -> evis_stage0_api.py -> reader_lab/interpreter/route_executor -> JSON
```

## Subir a API

```powershell
python domains\orcamentista\tools\evis_stage0_api.py --port 8765
```

Health check:

```txt
http://127.0.0.1:8765/health
```

## Endpoints

### Rodar tudo

```js
await fetch("http://127.0.0.1:8765/stage0/run-all", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    project_dir: "Orçamentos_2026/ORC_2026-001_Rita_e_Bruno_Quatro_Barras/anexos/projeto",
    provider: "openrouter",
    live: false,
    llm_call_limit: 2
  })
});
```

### Rodar somente Reader Lab

```js
await fetch("http://127.0.0.1:8765/stage0/run-reader", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ project_dir: "CAMINHO_DA_PASTA_DOS_PDFS" })
});
```

### Rodar somente Interpreter

```js
await fetch("http://127.0.0.1:8765/stage0/run-interpreter", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ reader_dir: "scratch/reader-lab/DATA_HORA/Folha_1" })
});
```

### Rodar somente Executor

```js
await fetch("http://127.0.0.1:8765/stage0/run-executor", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    evis_output: "scratch/reader-lab/DATA_HORA/Folha_1/evis_interpreter_output.json",
    provider: "openrouter",
    live: false,
    llm_call_limit: 2
  })
});
```

## Ler JSON pelo dashboard

```txt
GET http://127.0.0.1:8765/stage0/read-json?path=scratch/reader-lab/DATA_HORA/Folha_1/route_executor/route_execution.json
```

## Operação humana

- Se `resultado.acao = pacote_llm_vision_gerado`, revisar `prompt.md` e imagem indicada.
- Se `resultado.acao = enviar_para_especialistas`, folha complementar aprovada para disciplina.
- Se `resultado.acao = liberar_quantitativo`, Etapa 0 aprovada para Quantitativos.
- Se `resultado.acao = solicitar_validacao_humana`, humano decide manualmente.
