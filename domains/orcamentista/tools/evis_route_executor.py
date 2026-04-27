from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"
DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini"
DEFAULT_LLM_CALL_LIMIT = 2
PROMPT_VERSION = "evis_vision_prompt_v1.0"
POST_LLM_SCHEMA_VERSION = "llm_vision_v1"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S")


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def data_url(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def compact_candidates(items: list[dict[str, Any]], limit: int = 12) -> list[dict[str, Any]]:
    compacted = []
    for item in items[:limit]:
        compacted.append(
            {
                "rotulo": item.get("rotulo") or item.get("nome"),
                "valor_m2": item.get("valor_m2"),
                "valor_raw": item.get("valor_raw"),
                "status": item.get("status"),
                "suspeito": item.get("suspeito"),
                "confianca": item.get("confianca"),
                "confianca_espacial": item.get("confianca_espacial"),
                "regiao_origem": item.get("regiao_origem"),
                "fonte_autoritativa": item.get("fonte_autoritativa"),
                "motivos_suspeita": item.get("motivos_suspeita"),
                "evidencia": item.get("evidencia"),
            }
        )
    return compacted


def build_vision_prompt(evis_output: dict[str, Any]) -> str:
    repeated_alerts = [
        alerta.get("mensagem")
        for alerta in evis_output.get("alertas", [])
        if alerta.get("tipo") == "areas_repetidas"
    ]
    payload = {
        "tipo_folha": evis_output.get("tipo_folha"),
        "disciplinas_detectadas": evis_output.get("disciplinas_detectadas", []),
        "bloqueio": evis_output.get("bloqueio", {}),
        "alertas": evis_output.get("alertas", []),
        "areas_candidatas": compact_candidates(evis_output.get("areas_candidatas", []), limit=18),
        "associacoes_espaciais": compact_candidates(
            evis_output.get("associacoes_espaciais", {}).get("ambiente_area", []),
            limit=18,
        ),
    }
    repeated_text = "\n".join(f"- {item}" for item in repeated_alerts) or "- Nenhum alerta repetido especifico."
    return f"""PROMPT_VERSION: {PROMPT_VERSION}

Voce esta atuando como validador visual do sistema EVIS para projeto arquitetonico.

O Reader/Interpreter ja executou leitura fisica, geometria, regras e gate tecnico.
Sua tarefa NAO e refazer o parser inteiro. Sua tarefa e validar visualmente a folha/imagem enviada.

Alertas detectados:
{repeated_text}

Analise a imagem e responda estritamente em JSON valido, sem markdown, neste formato:
{{
  "status": "validado|parcial|inconclusivo",
  "area_total": {{"valor_m2": 0, "fonte_visual": "", "confianca": 0}},
  "areas_ambientes": [
    {{"ambiente": "", "valor_m2": 0, "fonte_visual": "", "confianca": 0}}
  ],
  "valores_invalidos": [
    {{"valor": "", "motivo": ""}}
  ],
  "observacoes": [],
  "confianca": 0
}}

Regras obrigatorias:
- Se o valor repetido 16,55 m2 parecer contaminacao visual ou nao pertencer aos ambientes, marque-o em valores_invalidos.
- Priorize quadro de areas, tabela/carimbo tecnico e texto legivel. Nao use valores soltos da planta como verdade final.
- Se nao conseguir ler o quadro com seguranca, retorne status "inconclusivo".
- Nao invente area. Use null quando nao legivel.

Dados extraidos pelo EVIS para auditoria:
{json.dumps(payload, ensure_ascii=False, indent=2)}
"""


def extract_json_from_text(text: str) -> Any:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text, flags=re.I).strip()
        text = re.sub(r"```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.S)
        if not match:
            raise
        return json.loads(match.group(0))


def parse_number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.strip().replace("m²", "").replace("m2", "").replace(",", ".")
        cleaned = re.sub(r"[^0-9.\-]+", "", cleaned)
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def clamp_confidence(value: Any) -> float:
    parsed = parse_number(value)
    if parsed is None:
        return 0.0
    if parsed > 1:
        parsed = parsed / 100
    return round(max(0.0, min(1.0, parsed)), 2)


def normalize_llm_validation(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        return {
            "status": "inconclusivo",
            "area_total": {"valor_m2": None, "fonte_visual": "", "confianca": 0.0},
            "areas_ambientes": [],
            "valores_invalidos": [],
            "observacoes": ["Resposta LLM nao retornou objeto JSON."],
            "confianca": 0.0,
            "schema_version": POST_LLM_SCHEMA_VERSION,
        }

    area_total = payload.get("area_total") or {}
    if not isinstance(area_total, dict):
        area_total = {"valor_m2": area_total}

    raw_rooms = payload.get("areas_ambientes") or payload.get("ambientes") or []
    rooms = []
    if isinstance(raw_rooms, list):
        for item in raw_rooms:
            if not isinstance(item, dict):
                continue
            rooms.append(
                {
                    "ambiente": str(item.get("ambiente") or item.get("nome") or "").strip().upper(),
                    "valor_m2": parse_number(item.get("valor_m2") or item.get("area_m2") or item.get("area")),
                    "fonte_visual": str(item.get("fonte_visual") or item.get("fonte") or ""),
                    "confianca": clamp_confidence(item.get("confianca")),
                }
            )

    invalid_values = []
    raw_invalids = payload.get("valores_invalidos") or []
    if isinstance(raw_invalids, list):
        for item in raw_invalids:
            if isinstance(item, dict):
                invalid_values.append(
                    {
                        "valor": str(item.get("valor") or "").replace(",", "."),
                        "motivo": str(item.get("motivo") or ""),
                    }
                )
            else:
                invalid_values.append({"valor": str(item).replace(",", "."), "motivo": ""})

    observations = payload.get("observacoes") or payload.get("observações") or []
    if isinstance(observations, str):
        observations = [observations]

    status = str(payload.get("status") or "inconclusivo").lower().strip()
    if status not in {"validado", "parcial", "inconclusivo"}:
        status = "inconclusivo"

    return {
        "status": status,
        "area_total": {
            "valor_m2": parse_number(area_total.get("valor_m2") or area_total.get("area_m2") or area_total.get("valor")),
            "fonte_visual": str(area_total.get("fonte_visual") or area_total.get("fonte") or ""),
            "confianca": clamp_confidence(area_total.get("confianca")),
        },
        "areas_ambientes": rooms,
        "valores_invalidos": invalid_values,
        "observacoes": [str(item) for item in observations if item],
        "confianca": clamp_confidence(payload.get("confianca")),
        "schema_version": POST_LLM_SCHEMA_VERSION,
    }


def llm_validation_is_usable(normalized: dict[str, Any]) -> bool:
    if normalized.get("status") not in {"validado", "parcial"}:
        return False
    if normalized.get("confianca", 0) < 0.65:
        return False
    total = normalized.get("area_total", {}).get("valor_m2")
    rooms = [item for item in normalized.get("areas_ambientes", []) if item.get("valor_m2")]
    return bool(total or rooms)


def count_llm_calls(route_dir: Path) -> int:
    versions_dir = route_dir / "versions"
    if not versions_dir.exists():
        return 0
    return len(list(versions_dir.glob("llm_validation_*.json")))


def count_reprocess_versions(route_dir: Path) -> int:
    versions_dir = route_dir / "versions"
    if not versions_dir.exists():
        return 0
    return len(list(versions_dir.glob("evis_output_pos_llm_*.json")))


def next_version_file(route_dir: Path, prefix: str, suffix: str) -> Path:
    versions_dir = route_dir / "versions"
    versions_dir.mkdir(parents=True, exist_ok=True)
    existing = sorted(versions_dir.glob(f"{prefix}_*{suffix}"))
    return versions_dir / f"{prefix}_{len(existing) + 1:03d}{suffix}"


def next_version_path(route_dir: Path, prefix: str) -> Path:
    return next_version_file(route_dir, prefix, ".json")


def update_versions_index(route_dir: Path, entry: dict[str, Any]) -> None:
    index_path = route_dir / "versions" / "index.json"
    entries: list[dict[str, Any]] = []
    if index_path.exists():
        current = read_json(index_path)
        if isinstance(current, list):
            entries = current
    entries.append({"timestamp": now_iso(), **entry})
    write_json(index_path, entries)


def invalid_value_matches(raw_value: Any, invalids: list[dict[str, Any]]) -> bool:
    parsed = parse_number(raw_value)
    if parsed is None:
        return False
    return any(parse_number(item.get("valor")) == parsed for item in invalids)


def apply_llm_validation_patch(evis_output: dict[str, Any], normalized: dict[str, Any]) -> dict[str, Any]:
    patched = json.loads(json.dumps(evis_output, ensure_ascii=False))
    patched["corrigido_por_llm"] = llm_validation_is_usable(normalized)
    patched["prompt_version"] = PROMPT_VERSION
    patched["post_llm_schema_version"] = POST_LLM_SCHEMA_VERSION
    invalids = normalized.get("valores_invalidos", [])
    for area in patched.get("areas_candidatas", []):
        if invalid_value_matches(area.get("valor_raw") or area.get("valor_m2"), invalids):
            area["suspeito"] = True
            area.setdefault("motivos_suspeita", [])
            if "invalidado_por_llm_vision" not in area["motivos_suspeita"]:
                area["motivos_suspeita"].append("invalidado_por_llm_vision")
            area["confianca"] = min(float(area.get("confianca", 0) or 0), 0.1)

    consolidated_rooms = []
    for room in normalized.get("areas_ambientes", []):
        if not room.get("ambiente") or room.get("valor_m2") is None:
            continue
        consolidated_rooms.append(
            {
                "nome": room["ambiente"],
                "area_m2": room["valor_m2"],
                "status": "validado_por_llm_vision",
                "confianca": room.get("confianca", normalized.get("confianca", 0)),
                "fonte_visual": room.get("fonte_visual"),
            }
        )

    if consolidated_rooms:
        patched["ambientes_validados_llm"] = consolidated_rooms
    if normalized.get("area_total", {}).get("valor_m2") is not None:
        patched["area_total_validada_llm"] = normalized["area_total"]

    patched["validacao_llm_normalizada"] = normalized
    patched["confianca_pos_llm"] = consolidated_confidence(evis_output, normalized)
    patched["score_final_hibrido"] = hybrid_final_score(evis_output, patched["confianca_pos_llm"])
    patched["roteamento_evis_pos_llm"] = reroute_after_llm(patched, normalized)
    return patched


def consolidated_confidence(evis_output: dict[str, Any], normalized: dict[str, Any]) -> float:
    initial = parse_number(evis_output.get("confianca_global")) or 0.0
    llm_conf = normalized.get("confianca", 0.0)
    if not llm_validation_is_usable(normalized):
        return round(min(initial, llm_conf), 2)
    return round(max(initial, (initial * 0.35) + (llm_conf * 0.65)), 2)


def structural_score(evis_output: dict[str, Any]) -> float:
    initial = parse_number(evis_output.get("confianca_global")) or 0.0
    spatial_values = [
        parse_number(item.get("confianca_espacial")) or 0.0
        for item in evis_output.get("associacoes_espaciais", {}).get("ambiente_area", [])
    ]
    spatial = sum(spatial_values) / len(spatial_values) if spatial_values else initial
    return round((initial * 0.65) + (spatial * 0.35), 2)


def hybrid_final_score(evis_output: dict[str, Any], post_llm_confidence: float) -> float:
    return round((0.6 * post_llm_confidence) + (0.4 * structural_score(evis_output)), 2)


def reroute_after_llm(patched_output: dict[str, Any], normalized: dict[str, Any]) -> dict[str, Any]:
    if llm_validation_is_usable(normalized):
        return {
            "proximo_passo": "quantitativos",
            "motivo": "Validacao LLM Vision normalizada forneceu dados confiaveis para seguir.",
            "entrada_recomendada": None,
        }
    return {
        "proximo_passo": "hitl_manual",
        "motivo": "Validacao LLM Vision nao atingiu confianca minima; enviar para validacao humana.",
        "entrada_recomendada": patched_output.get("metadata", {}).get("page_image"),
    }


def post_json(url: str, headers: dict[str, str], payload: dict[str, Any], timeout: int = 120) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Falha HTTP {exc.code}: {body}") from exc


def openai_vision(prompt: str, image_path: Path) -> dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY nao configurada.")
    model = os.environ.get("EVIS_VISION_MODEL") or os.environ.get("OPENAI_VISION_MODEL") or DEFAULT_OPENAI_MODEL
    response = post_json(
        "https://api.openai.com/v1/responses",
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        {
            "model": model,
            "input": [
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {"type": "input_image", "image_url": data_url(image_path), "detail": "high"},
                    ],
                }
            ],
        },
    )
    output_text = response.get("output_text")
    if not output_text:
        texts = []
        for item in response.get("output", []):
            for content in item.get("content", []) or []:
                if content.get("type") in {"output_text", "text"} and content.get("text"):
                    texts.append(content["text"])
        output_text = "\n".join(texts)
    return {
        "provider": "openai",
        "model": model,
        "raw": response,
        "text": output_text,
        "parsed": extract_json_from_text(output_text) if output_text else None,
    }


def openrouter_vision(prompt: str, image_path: Path) -> dict[str, Any]:
    api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("VITE_OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY nao configurada.")
    model = os.environ.get("EVIS_VISION_MODEL") or os.environ.get("ORCAMENTISTA_VISION_MODEL") or DEFAULT_OPENROUTER_MODEL
    response = post_json(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": os.environ.get("APP_URL", "http://localhost:3000"),
            "X-Title": "EVIS Orçamentista",
        },
        {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_url(image_path)}},
                    ],
                }
            ],
            "temperature": 0,
            "max_tokens": 1800,
        },
    )
    output_text = response.get("choices", [{}])[0].get("message", {}).get("content", "")
    return {
        "provider": "openrouter",
        "model": model,
        "raw": response,
        "text": output_text,
        "parsed": extract_json_from_text(output_text) if output_text else None,
    }


def resolve_image_path(evis_output: dict[str, Any], base_dir: Path) -> Path | None:
    routing_path = evis_output.get("roteamento_evis", {}).get("entrada_recomendada")
    llm_path = evis_output.get("verificacao_llm", {}).get("imagem_base")
    raw_path = routing_path or llm_path or evis_output.get("metadata", {}).get("page_image")
    if not raw_path:
        return None
    path = Path(raw_path)
    if path.exists():
        return path
    candidate = base_dir / path
    return candidate if candidate.exists() else path


def package_llm_vision(evis_output: dict[str, Any], input_path: Path, out_dir: Path) -> dict[str, Any]:
    image_path = resolve_image_path(evis_output, input_path.parent)
    prompt = build_vision_prompt(evis_output)
    package_dir = out_dir / "llm_vision_package"
    versioned_prompt_path = next_version_file(out_dir, "prompt", ".md")
    versioned_prompt_meta_path = next_version_path(out_dir, "prompt_metadata")
    write_text(package_dir / "prompt.md", prompt)
    write_text(versioned_prompt_path, prompt)
    write_json(
        versioned_prompt_meta_path,
        {
            "prompt_version": PROMPT_VERSION,
            "image_path": str(image_path) if image_path else None,
            "source_input": str(input_path),
            "tipo_folha": evis_output.get("tipo_folha"),
            "roteamento": evis_output.get("roteamento_evis", {}),
        },
    )
    write_json(
        package_dir / "input.json",
        {
            "image_path": str(image_path) if image_path else None,
            "areas_candidatas": evis_output.get("areas_candidatas", []),
            "alertas": evis_output.get("alertas", []),
            "associacoes_espaciais": evis_output.get("associacoes_espaciais", {}),
        },
    )
    update_versions_index(
        out_dir,
        {
            "tipo": "prompt_llm_vision",
            "prompt_version": PROMPT_VERSION,
            "arquivo": str(versioned_prompt_path),
            "metadata": str(versioned_prompt_meta_path),
            "decisao": evis_output.get("roteamento_evis", {}).get("proximo_passo"),
            "confianca": evis_output.get("confianca_global"),
        },
    )
    return {
        "acao": "pacote_llm_vision_gerado",
        "prompt_path": str(package_dir / "prompt.md"),
        "prompt_version": PROMPT_VERSION,
        "prompt_versionado_path": str(versioned_prompt_path),
        "input_path": str(package_dir / "input.json"),
        "image_path": str(image_path) if image_path else None,
    }


def process_llm_result(
    evis_output: dict[str, Any],
    input_path: Path,
    out_dir: Path,
    result: dict[str, Any],
) -> dict[str, Any]:
    normalized = normalize_llm_validation(result.get("parsed"))
    validation_path = next_version_path(out_dir, "llm_validation")
    patched_path = next_version_path(out_dir, "evis_output_pos_llm")
    write_json(validation_path, normalized)
    patched = apply_llm_validation_patch(evis_output, normalized)
    write_json(patched_path, patched)
    update_versions_index(
        out_dir,
        {
            "tipo": "llm_validation",
            "arquivo": str(validation_path),
            "decisao": patched.get("roteamento_evis_pos_llm", {}).get("proximo_passo"),
            "confianca": normalized.get("confianca"),
            "score_final_hibrido": patched.get("score_final_hibrido"),
            "corrigido_por_llm": patched.get("corrigido_por_llm"),
        },
    )
    update_versions_index(
        out_dir,
        {
            "tipo": "evis_output_pos_llm",
            "arquivo": str(patched_path),
            "decisao": patched.get("roteamento_evis_pos_llm", {}).get("proximo_passo"),
            "confianca": patched.get("confianca_pos_llm"),
            "score_final_hibrido": patched.get("score_final_hibrido"),
            "corrigido_por_llm": patched.get("corrigido_por_llm"),
        },
    )
    return {
        "normalizado_path": str(validation_path),
        "evis_output_pos_llm_path": str(patched_path),
        "validacao_utilizavel": llm_validation_is_usable(normalized),
        "confianca_pos_llm": patched.get("confianca_pos_llm"),
        "score_final_hibrido": patched.get("score_final_hibrido"),
        "corrigido_por_llm": patched.get("corrigido_por_llm"),
        "roteamento_pos_llm": patched.get("roteamento_evis_pos_llm"),
    }


def executar_llm_vision(
    evis_output: dict[str, Any],
    input_path: Path,
    out_dir: Path,
    provider: str,
    live: bool,
    llm_call_limit: int,
) -> dict[str, Any]:
    image_path = resolve_image_path(evis_output, input_path.parent)
    if not image_path or not image_path.exists():
        return {
            "acao": "erro",
            "erro": "Imagem recomendada nao encontrada.",
            "image_path": str(image_path) if image_path else None,
        }

    calls_used = count_llm_calls(out_dir)
    reprocess_used = count_reprocess_versions(out_dir)
    if calls_used >= llm_call_limit or reprocess_used >= llm_call_limit:
        return {
            "acao": "solicitar_validacao_humana",
            "status": "limite_llm_excedido",
            "llm_calls_usadas": calls_used,
            "reprocessamentos_usados": reprocess_used,
            "llm_call_limit": llm_call_limit,
            "motivo": "Limite de chamadas LLM atingido; fallback para HITL.",
        }

    package = package_llm_vision(evis_output, input_path, out_dir)
    if not live:
        return {
            **package,
            "modo": "dry_run",
            "llm_calls_usadas": calls_used,
            "reprocessamentos_usados": reprocess_used,
            "llm_call_limit": llm_call_limit,
            "observacao": "Use --live para chamar o provedor de visao configurado.",
        }

    prompt = build_vision_prompt(evis_output)
    if provider == "openai":
        result = openai_vision(prompt, image_path)
    elif provider == "openrouter":
        result = openrouter_vision(prompt, image_path)
    else:
        try:
            result = openai_vision(prompt, image_path)
        except RuntimeError:
            result = openrouter_vision(prompt, image_path)

    write_json(out_dir / "llm_vision_result.json", result)
    post_llm = process_llm_result(evis_output, input_path, out_dir, result)
    return {
        "acao": "llm_vision_executado",
        "provider": result["provider"],
        "model": result["model"],
        "result_path": str(out_dir / "llm_vision_result.json"),
        "parsed": result.get("parsed"),
        **post_llm,
    }


def executar_roteamento(
    evis_output: dict[str, Any],
    input_path: Path,
    provider: str,
    live: bool,
    llm_call_limit: int,
) -> dict[str, Any]:
    out_dir = input_path.parent / "route_executor"
    route = evis_output.get("roteamento_evis", {})
    step = route.get("proximo_passo")

    if step in {"quantitativos", "liberar_quantitativo"}:
        action = {
            "acao": "liberar_quantitativo",
            "status": "pronto_para_quantitativos",
            "motivo": route.get("motivo"),
        }
    elif step == "verificacao_llm_vision":
        action = executar_llm_vision(evis_output, input_path, out_dir, provider, live, llm_call_limit)
    elif step == "classificar_complementar":
        action = {
            "acao": "enviar_para_especialistas",
            "status": "folha_complementar",
            "disciplinas": evis_output.get("disciplinas_detectadas", []),
            "motivo": route.get("motivo"),
        }
    elif step in {"hitl", "hitl_manual", "auditoria_humana"}:
        action = {
            "acao": "solicitar_validacao_humana",
            "status": "pendente_hitl",
            "motivos": evis_output.get("bloqueio", {}).get("motivos", []),
        }
    else:
        action = {
            "acao": "erro",
            "erro": f"Roteamento desconhecido: {step}",
        }

    audit = {
        "generated_at": now_iso(),
        "input": str(input_path),
        "roteamento": route,
        "live": live,
        "provider_preferido": provider,
        "llm_call_limit": llm_call_limit,
        "llm_calls_usadas": count_llm_calls(out_dir),
        "reprocessamentos_usados": count_reprocess_versions(out_dir),
        "resultado": action,
    }
    write_json(out_dir / "route_execution.json", audit)
    return audit


def main() -> int:
    parser = argparse.ArgumentParser(description="Execute EVIS routing from evis_interpreter_output.json.")
    parser.add_argument("evis_output", type=Path, help="Path to evis_interpreter_output.json.")
    parser.add_argument("--provider", choices=["auto", "openai", "openrouter"], default="auto")
    parser.add_argument("--live", action="store_true", help="Call the configured vision provider. Default only writes package/audit files.")
    parser.add_argument("--llm-call-limit", type=int, default=DEFAULT_LLM_CALL_LIMIT, help="Max LLM validations per interpreter output.")
    parser.add_argument("--env", type=Path, default=Path(".env"), help="Optional .env path.")
    args = parser.parse_args()

    load_dotenv(args.env)
    evis_output = read_json(args.evis_output)
    audit = executar_roteamento(evis_output, args.evis_output, args.provider, args.live, args.llm_call_limit)
    print(f"[evis-route-executor] acao={audit['resultado'].get('acao')} live={audit['live']}")
    print(f"[evis-route-executor] salvo: {args.evis_output.parent / 'route_executor' / 'route_execution.json'}")
    if audit["resultado"].get("prompt_path"):
        print(f"[evis-route-executor] prompt: {audit['resultado']['prompt_path']}")
    if audit["resultado"].get("result_path"):
        print(f"[evis-route-executor] resultado_llm: {audit['resultado']['result_path']}")
    if audit["resultado"].get("evis_output_pos_llm_path"):
        print(f"[evis-route-executor] pos_llm: {audit['resultado']['evis_output_pos_llm_path']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
