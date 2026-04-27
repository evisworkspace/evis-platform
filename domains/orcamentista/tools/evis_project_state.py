from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path
from typing import Any


ROOT_MANIFEST = "project_state.json"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


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


def latest_file(pattern: str, root: Path) -> Path | None:
    files = sorted(root.glob(pattern), key=lambda item: item.stat().st_mtime, reverse=True)
    return files[0] if files else None


def latest_run_dir(search_root: Path) -> Path:
    candidates = [item for item in search_root.iterdir() if item.is_dir() and list(item.glob("Folha_*"))]
    if not candidates:
        raise FileNotFoundError("Nenhuma execucao encontrada em scratch/reader-lab.")
    return max(candidates, key=lambda item: item.stat().st_mtime)


def load_previous_manifest(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    current = read_json(path)
    return current if isinstance(current, dict) else {}


def default_history_entry(timestamp: str, details: str) -> dict[str, Any]:
    return {
        "id": f"h-{int(time.time() * 1000)}",
        "timestamp": timestamp,
        "user": "evisworkspace@gmail.com",
        "decision": "none",
        "details": details,
    }


def normalize_name(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().upper())


def build_extracted_data(source: dict[str, Any]) -> list[dict[str, Any]]:
    extracted: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in source.get("associacoes_espaciais", {}).get("ambiente_area", []) or []:
        if not isinstance(item, dict):
            continue
        room = normalize_name(str(item.get("nome") or ""))
        if not room or room in seen:
            continue
        area = parse_number(item.get("area_m2") or item.get("valor_raw"))
        if area is None:
            continue
        extracted.append(
            {
                "room": room.title(),
                "area": round(area, 2),
                "highlight": "suspeita" in str(item.get("status") or "").lower()
                or (parse_number(item.get("confianca")) or 0.0) < 0.6,
            }
        )
        seen.add(room)
        if len(extracted) >= 6:
            break
    return extracted


def build_corrected_data(source: dict[str, Any]) -> list[dict[str, Any]]:
    corrected: list[dict[str, Any]] = []
    for item in source.get("ambientes_validados_llm", []) or []:
        if not isinstance(item, dict):
            continue
        room = normalize_name(str(item.get("nome") or item.get("ambiente") or ""))
        area = parse_number(item.get("area_m2") or item.get("valor_m2"))
        if not room or area is None:
            continue
        corrected.append({"room": room.title(), "area": round(area, 2), "highlight": True})
    return corrected


def build_audit_items(source: dict[str, Any], extracted: list[dict[str, Any]], corrected: list[dict[str, Any]]) -> list[dict[str, Any]]:
    extracted_by_room = {normalize_name(item["room"]): item for item in extracted}
    corrected_by_room = {normalize_name(item["room"]): item for item in corrected}
    names = list(dict.fromkeys([*extracted_by_room.keys(), *corrected_by_room.keys()]))
    items: list[dict[str, Any]] = []
    for index, room in enumerate(names, start=1):
        extracted_item = extracted_by_room.get(room)
        corrected_item = corrected_by_room.get(room)
        area_extracted = extracted_item["area"] if extracted_item else corrected_item["area"]
        area_validated = corrected_item["area"] if corrected_item else area_extracted
        status = "OK"
        origin = "OCR"
        if corrected_item and extracted_item and corrected_item["area"] != extracted_item["area"]:
            status = "Corrigido"
            origin = "IA"
        elif corrected_item and source.get("corrigido_por_llm"):
            status = "Corrigido"
            origin = "IA"
        elif extracted_item and extracted_item.get("highlight"):
            status = "Suspeito"
        items.append(
            {
                "id": f"a{index}",
                "ambient": room.title(),
                "areaExtracted": round(area_extracted, 2),
                "areaValidated": round(area_validated, 2),
                "origin": origin,
                "confidence": round(
                    parse_number(source.get("confianca_pos_llm"))
                    or parse_number(source.get("confianca_global"))
                    or 0.0,
                    2,
                ),
                "status": status,
                "region": (source.get("area_total_validada_llm", {}) or {}).get("fonte_visual")
                or source.get("tipo_folha")
                or "N/A",
                "observations": "; ".join(
                    [item.get("mensagem") for item in source.get("alertas", []) or [] if isinstance(item, dict) and item.get("mensagem")]
                )
                or None,
                "aiPrompt": None,
                "aiRawResponse": None,
            }
        )
    return items


def classify_sheet_type(source: dict[str, Any], route_action: str | None) -> str:
    if route_action == "enviar_para_especialistas":
        return "complementar"
    tipo_folha = str(source.get("tipo_folha") or "").lower()
    if "corte" in tipo_folha or "fachada" in tipo_folha or "complement" in tipo_folha:
        return "complementar"
    return "setorial"


def derive_status(route_action: str | None, source: dict[str, Any], quantitativos_path: Path | None) -> tuple[str, int, str, bool]:
    post_route = source.get("roteamento_evis_pos_llm", {}) or {}
    if post_route.get("proximo_passo") == "quantitativos" or quantitativos_path:
        return "completed", 3, "liberar_quantitativo", False
    if route_action == "enviar_para_especialistas":
        return "completed", 2, route_action, False
    if route_action in {"pacote_llm_vision_gerado", "solicitar_validacao_humana"}:
        return "blocked", 2, route_action, True
    if route_action == "liberar_quantitativo":
        return "completed", 3, route_action, False
    return "pending", 1, route_action or "solicitar_validacao_humana", True


def build_folha_state(
    folha_dir: Path,
    source: dict[str, Any],
    route_data: dict[str, Any],
    previous: dict[str, Any],
) -> dict[str, Any]:
    route_result = route_data.get("resultado", {}) if isinstance(route_data, dict) else {}
    route_action = route_result.get("acao")
    validated_path = latest_file("route_executor/versions/evis_output_pos_llm_*.json", folha_dir)
    quantitativos_path = folha_dir / "evis_quantitativos_output.json"
    if not quantitativos_path.exists():
        quantitativos_path = None

    status, current_step, action, blocked = derive_status(route_action, source, quantitativos_path)
    extracted_data = build_extracted_data(source)
    corrected_data = build_corrected_data(source)
    audit_items = build_audit_items(source, extracted_data, corrected_data)
    confidence = (
        parse_number(source.get("confianca_pos_llm"))
        or parse_number(source.get("confianca_global"))
        or 0.0
    )
    source_file = Path(str(source.get("metadata", {}).get("source_file") or folha_dir.name))
    history = previous.get("history") or []
    if not history:
        history = [default_history_entry(route_data.get("generated_at") or time.strftime("%Y-%m-%d %H:%M:%S"), "Leitura inicial automática")]

    return {
        "id": f"f{folha_dir.name.split('_')[-1]}",
        "name": f"{folha_dir.name.replace('_', ' ')} - {source_file.stem}",
        "type": classify_sheet_type(source, route_action),
        "status": status,
        "currentStep": current_step,
        "action": action,
        "confidenceScore": round(confidence, 2),
        "lastUpdated": route_data.get("generated_at") or source.get("metadata", {}).get("generated_at") or "",
        "jsonPath": str(folha_dir / "route_executor" / "route_execution.json"),
        "executorInputPath": str(folha_dir / "evis_interpreter_output.json"),
        "validatedOutputPath": str(validated_path) if validated_path else "",
        "quantitativosPath": str(quantitativos_path) if quantitativos_path else "",
        "readerDir": str(folha_dir),
        "bloquear_quantitativo": blocked,
        "corrigido_por_llm": bool(source.get("corrigido_por_llm")),
        "alerts": [item.get("mensagem") for item in source.get("alertas", []) or [] if isinstance(item, dict) and item.get("mensagem")],
        "conflicts": [item.get("descricao") for item in source.get("conflitos", []) or [] if isinstance(item, dict) and item.get("descricao")],
        "extractedData": extracted_data,
        "correctedData": corrected_data,
        "auditItems": audit_items,
        "history": history,
        "decisao_humana": previous.get("decisao_humana", "none"),
        "manualVal": previous.get("manualVal"),
    }


def build_manifest(run_dir: Path, previous_manifest: dict[str, Any]) -> dict[str, Any]:
    previous_by_id = {
        item.get("id"): item
        for item in previous_manifest.get("folhas", []) or []
        if isinstance(item, dict) and item.get("id")
    }
    folhas: list[dict[str, Any]] = []
    for folha_dir in sorted(run_dir.glob("Folha_*"), key=lambda item: item.name):
        route_path = folha_dir / "route_executor" / "route_execution.json"
        route_data = read_json(route_path) if route_path.exists() else {}
        interpreter_path = folha_dir / "evis_interpreter_output.json"
        reader_report_path = folha_dir / "reader_report.json"
        source_path = latest_file("route_executor/versions/evis_output_pos_llm_*.json", folha_dir)
        if source_path is None and interpreter_path.exists():
            source_path = interpreter_path
        if source_path is None and reader_report_path.exists():
            source_path = reader_report_path
        if source_path is None or not source_path.exists():
            continue
        source = read_json(source_path)
        folha_id = f"f{folha_dir.name.split('_')[-1]}"
        folhas.append(build_folha_state(folha_dir, source, route_data, previous_by_id.get(folha_id, {})))

    return {
        "run_id": run_dir.name,
        "run_dir": str(run_dir),
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "folhas": folhas,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Sincroniza o project_state.json consumido pelo dashboard EVIS.")
    parser.add_argument("--search-root", type=Path, default=Path("scratch/reader-lab"))
    parser.add_argument("--run-id", type=str, default=None)
    args = parser.parse_args()

    search_root = args.search_root.resolve()
    run_dir = (search_root / args.run_id).resolve() if args.run_id else latest_run_dir(search_root)
    if not run_dir.exists():
        raise FileNotFoundError(f"Execucao nao encontrada: {run_dir}")

    root_manifest_path = search_root / ROOT_MANIFEST
    previous_manifest = load_previous_manifest(root_manifest_path)
    manifest = build_manifest(run_dir, previous_manifest)

    write_json(root_manifest_path, manifest)
    write_json(run_dir / ROOT_MANIFEST, manifest)
    print(f"[evis-project-state] run_id={manifest['run_id']}")
    print(f"[evis-project-state] folhas={len(manifest['folhas'])}")
    print(f"[evis-project-state] salvo: {root_manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
